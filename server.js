/**
 * SaafPDF - Universal Share Link Server
 * First-party backend bound to loopback interface (127.0.0.1)
 * Provides SSRF-protected universal ChatGPT & Gemini Share Link import & serves frontend.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1'; // Loopback binding

app.use(cors({ origin: `http://localhost:${PORT}` }));
app.use(express.json({ limit: '1mb' }));

// Static vendor assets from node_modules
app.use('/vendor/katex', express.static(path.join(__dirname, 'node_modules/katex/dist')));
app.use('/vendor/dompurify', express.static(path.join(__dirname, 'node_modules/dompurify/dist')));
app.use('/vendor/html2pdf', express.static(path.join(__dirname, 'node_modules/html2pdf.js/dist')));

// Static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Whitelist of allowed providers for share links
const ALLOWED_HOSTS = new Set([
  'chatgpt.com',
  'chat.openai.com',
  'gemini.google.com',
  'g.co'
]);

/**
 * Validate URL strictly against SSRF and provider whitelist
 */
function validateShareUrl(rawUrl) {
  try {
    let clean = (rawUrl || '').trim();
    if (!clean.startsWith('https://') && !clean.startsWith('http://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);

    // 1. Enforce HTTPS only
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Keval secure HTTPS links accept kiye jaate hain (https://...).' };
    }

    // 2. Exact hostname whitelist match
    const hostname = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(hostname)) {
      return {
        valid: false,
        error: `Asamarthit provider: "${hostname}". Keval ChatGPT (chatgpt.com) ya Gemini (gemini.google.com) ke public share links supported hain.`
      };
    }

    // 3. Reject credentials or custom ports
    if (parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) {
      return { valid: false, error: 'URL mein credentials ya non-standard ports allow nahi hain.' };
    }

    // 4. Validate share path pattern
    const pathname = parsed.pathname;
    if (hostname === 'g.co') {
      if (!pathname.startsWith('/gemini/share/')) {
        return { valid: false, error: 'Invalid g.co link format. Format: https://g.co/gemini/share/...' };
      }
    } else {
      if (!pathname.startsWith('/share/') || pathname.length <= 7) {
        return {
          valid: false,
          error: 'Invalid share URL format. Format aesa hona chahiye: https://chatgpt.com/share/...'
        };
      }
    }

    return { valid: true, parsedUrl: parsed };
  } catch (err) {
    return { valid: false, error: 'Awaidh URL format. Kripya sahi link paste karein.' };
  }
}

/**
 * Safe fetch with SSRF protection, size limits, and timeout
 */
function safeFetchHtml(targetUrl, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error('Bahut zyada redirects mile. Request radd kar di gayi.'));
    }

    const validation = validateShareUrl(targetUrl);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const parsed = validation.parsedUrl;
    const reqOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Sec-Fetch-Mode': 'navigate'
      },
      timeout: 10000 // 10s timeout
    };

    const req = https.request(reqOptions, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl;
        try {
          redirectUrl = new URL(res.headers.location, targetUrl).toString();
        } catch (e) {
          return reject(new Error('Invalid redirect location.'));
        }
        res.resume();
        return safeFetchHtml(redirectUrl, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode === 404) {
        return reject(new Error('Share link nahi mila (404 Not Found). Link expire ho gaya ho sakta hai ya delete ho chuka hai.'));
      }

      if (res.statusCode === 401 || res.statusCode === 403) {
        return reject(new Error('Yeh chat private hai ya login zaroori hai. ChatGPT/Gemini mein "Anyone with the link" sharing enable karein.'));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Server response error (${res.statusCode}). Provider page load nahi ho saka.`));
      }

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        return reject(new Error('Unsupported response type: Provider ne HTML page nahi bheja.'));
      }

      let data = '';
      let bytesCount = 0;
      const MAX_BYTES = 5 * 1024 * 1024; // 5MB limit

      res.on('data', (chunk) => {
        bytesCount += chunk.length;
        if (bytesCount > MAX_BYTES) {
          req.destroy(new Error('Response size limit (5MB) exceed ho gaya.'));
          return;
        }
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timeout ho gaya (10 seconds). Provider response nahi de raha.'));
    });

    req.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });

    req.end();
  });
}

/**
 * Universal ChatGPT parser with zero-hardcoded-indices dynamic key resolution
 */
function parseChatGptShare(html) {
  const $ = cheerio.load(html);
  let messages = [];
  let title = $('title').text().replace(/^ChatGPT\s*-\s*/i, '').replace(/\s*\|\s*ChatGPT$/i, '').trim() || 'ChatGPT Shared Conversation';

  // Strategy 1: Dynamic Turbo-stream resolver (ChatGPT React Router 2024-2026)
  $('script').each((i, element) => {
    if (messages.length > 0) return;
    const content = $(element).html() || '';
    if (content.includes('streamController.enqueue')) {
      const startIdx = content.indexOf('streamController.enqueue(');
      const lastParen = content.lastIndexOf(')');
      if (startIdx !== -1 && lastParen > startIdx) {
        const jsonLiteral = content.substring(startIdx + 'streamController.enqueue('.length, lastParen).trim();
        try {
          const inner = JSON.parse(jsonLiteral);
          const arr = JSON.parse(inner);

          if (Array.isArray(arr)) {
            // Build dynamic index-to-key dictionary
            const idxToKey = new Map();
            for (let k = 0; k < arr.length; k++) {
              if (typeof arr[k] === 'string' && arr[k].length < 60) {
                idxToKey.set(k, arr[k]);
              }
            }

            // Universal Turbo-stream node resolver
            function resolve(index, visited = new Set()) {
              if (index === null || index === undefined || index < 0 || index >= arr.length) return undefined;
              if (visited.has(index)) return undefined;
              visited.add(index);

              const val = arr[index];
              if (val === null || val === undefined) return val;
              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                return val;
              }
              if (Array.isArray(val)) {
                return val.map(childIdx => resolve(childIdx, new Set(visited)));
              }
              if (typeof val === 'object') {
                const out = {};
                for (const [propName, propVal] of Object.entries(val)) {
                  if (propName.startsWith('_')) {
                    const keyIdx = parseInt(propName.substring(1), 10);
                    const realKey = idxToKey.get(keyIdx) || propName;
                    out[realKey] = resolve(propVal, new Set(visited));
                  } else {
                    out[propName] = resolve(propVal, new Set(visited));
                  }
                }
                return out;
              }
              return val;
            }

            const messageMap = new Map();
            for (let idx = 0; idx < arr.length; idx++) {
              const item = arr[idx];
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                const resolved = resolve(idx);
                if (resolved && resolved.author && resolved.content) {
                  const role = resolved.author.role;
                  const id = resolved.id || ('msg_' + idx);
                  const createTime = resolved.create_time || 0;
                  const textParts = (resolved.content.parts || []).filter(p => typeof p === 'string' && p.trim());

                  if (id && textParts.length > 0 && (role === 'user' || role === 'assistant')) {
                    if (!messageMap.has(id)) {
                      messageMap.set(id, {
                        id,
                        role: role === 'user' ? 'User' : 'Assistant',
                        createTime,
                        content: textParts.join('\n\n').trim()
                      });
                    }
                  }
                }
              }
            }

            if (messageMap.size > 0) {
              messages = Array.from(messageMap.values()).sort((a, b) => a.createTime - b.createTime);
            }
          }
        } catch (e) {
          // Continue to next script
        }
      }
    }
  });

  // Strategy 2: Legacy Next.js __NEXT_DATA__
  if (messages.length === 0) {
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        const serverResponse = nextData?.props?.pageProps?.serverResponse?.data;
        if (serverResponse) {
          if (serverResponse.title) {
            title = serverResponse.title;
          }
          const mapping = serverResponse.mapping || {};
          const nodes = Object.values(mapping).filter(node => node && node.message && node.message.content);
          nodes.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));

          for (const node of nodes) {
            const msg = node.message;
            const role = msg.author?.role;
            if (role !== 'user' && role !== 'assistant') continue;

            let textContent = '';
            const parts = msg.content?.parts || [];
            for (const part of parts) {
              if (typeof part === 'string') {
                textContent += part + '\n';
              } else if (part && typeof part.text === 'string') {
                textContent += part.text + '\n';
              }
            }

            textContent = textContent.trim();
            if (textContent) {
              messages.push({
                role: role === 'user' ? 'User' : 'Assistant',
                content: textContent
              });
            }
          }
        }
      } catch (e) {
        // Fallback
      }
    }
  }

  // Strategy 3: Client bootstrap JSON
  if (messages.length === 0) {
    const bootstrapScript = $('#client-bootstrap').html();
    if (bootstrapScript) {
      try {
        const bData = JSON.parse(bootstrapScript);
        // Deep search for mapping or messages
        function findConvo(obj) {
          if (!obj || typeof obj !== 'object') return;
          if (obj.mapping && typeof obj.mapping === 'object') {
            const nodes = Object.values(obj.mapping).filter(n => n && n.message && n.message.content);
            nodes.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
            for (const node of nodes) {
              const role = node.message.author?.role;
              const parts = (node.message.content?.parts || []).filter(p => typeof p === 'string' && p.trim());
              if ((role === 'user' || role === 'assistant') && parts.length > 0) {
                messages.push({
                  role: role === 'user' ? 'User' : 'Assistant',
                  content: parts.join('\n\n')
                });
              }
            }
            return;
          }
          for (const val of Object.values(obj)) {
            findConvo(val);
            if (messages.length > 0) return;
          }
        }
        findConvo(bData);
      } catch (e) {}
    }
  }

  // Strategy 4: DOM parsing fallback
  if (messages.length === 0) {
    $('article, [data-message-author-role]').each((i, el) => {
      const role = $(el).attr('data-message-author-role') || ($(el).find('[data-message-author-role]').attr('data-message-author-role')) || 'assistant';
      $(el).find('button, svg, script, style, nav').remove();
      const content = $(el).text().trim();
      if (content) {
        messages.push({
          role: role.toLowerCase().includes('user') ? 'User' : 'Assistant',
          content
        });
      }
    });
  }

  return { title, messages };
}

/**
 * Universal Gemini parser
 */
function parseGeminiShare(html) {
  const $ = cheerio.load(html);
  let messages = [];
  let title = $('title').text().replace(/^Gemini\s*-\s*/i, '').replace(/\s*-\s*Gemini$/i, '').trim() || 'Gemini Shared Conversation';

  // Strategy 1: AF_initDataCallback scripts (Standard Google Apps initial data)
  $('script').each((i, element) => {
    const text = $(element).html() || '';
    if (text.includes('AF_initDataCallback') && text.includes('data:')) {
      try {
        const dataMatch = text.match(/data:\s*(\[[\s\S]*?\])\s*,\s*sideChannel:/);
        if (dataMatch) {
          const rawData = JSON.parse(dataMatch[1]);
          
          // Deep search in nested arrays for pairs of queries and responses
          function extractGeminiStrings(node, result = []) {
            if (typeof node === 'string' && node.length > 10) {
              result.push(node);
            } else if (Array.isArray(node)) {
              for (const child of node) {
                extractGeminiStrings(child, result);
              }
            }
            return result;
          }

          const allStrings = extractGeminiStrings(rawData);
          // Look for Markdown content with tables or math
          for (let s = 0; s < allStrings.length; s++) {
            const str = allStrings[s];
            if (str.includes('|') || str.includes('$$') || str.includes('$') || str.length > 80) {
              messages.push({
                role: s % 2 === 0 ? 'User' : 'Assistant',
                content: str
              });
            }
          }
        }
      } catch (e) {}
    }
  });

  // Strategy 2: Web components and DOM elements
  if (messages.length === 0) {
    $('message-content, user-query, model-response, div[data-response-index], .conversation-container, .user-query-container, .model-response-text').each((i, el) => {
      $(el).find('button, svg, script, style').remove();
      const tagName = el.tagName.toLowerCase();
      const isUser = tagName === 'user-query' || $(el).hasClass('user-query-container') || $(el).text().includes('User');
      const text = $(el).text().trim();
      if (text) {
        messages.push({
          role: isUser ? 'User' : 'Assistant',
          content: text
        });
      }
    });
  }

  // Strategy 3: Search for rich markdown blocks in any element
  if (messages.length === 0) {
    $('.markdown, .response-content').each((i, el) => {
      $(el).find('button, svg, script, style').remove();
      const text = $(el).text().trim();
      if (text) {
        messages.push({
          role: 'Assistant',
          content: text
        });
      }
    });
  }

  return { title, messages };
}

/**
 * Clean ChatGPT & Gemini custom UI pseudo-tags (<box>, <row>, etc.)
 */
function cleanMessageContent(str) {
  if (!str) return '';
  return str
    .replace(/<\/?(box|row|text|icon)[^>]*>/gi, '')
    .replace(/sandbox_download_unverified[^\n]*\n?/gi, '')
    .trim();
}

/**
 * Convert structured messages to clean Markdown format
 */
function formatConversationToMarkdown(title, messages) {
  let md = `# ${title}\n\n`;
  for (const msg of messages) {
    const cleanText = cleanMessageContent(msg.content);
    if (!cleanText) continue;
    const roleIcon = msg.role === 'User' ? '👤' : '🤖';
    md += `### ${roleIcon} ${msg.role}:\n\n${cleanText}\n\n---\n\n`;
  }
  return md;
}

// API: Share link import endpoint
app.post('/api/import-share', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'URL missing hai. Kripya valid ChatGPT ya Gemini public share link dalein.'
    });
  }

  const trimmedUrl = url.trim();
  const validation = validateShareUrl(trimmedUrl);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  try {
    const html = await safeFetchHtml(trimmedUrl);
    const hostname = validation.parsedUrl.hostname.toLowerCase();

    let result;
    if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
      result = parseChatGptShare(html);
    } else if (hostname.includes('gemini.google.com') || hostname.includes('g.co')) {
      result = parseGeminiShare(html);
    }

    if (!result || !result.messages || result.messages.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Conversation messages pehchane nahi jaa sake. Kripya sunishchit karein ki share link public hai aur chat empty nahi hai. Ya aap chat text ko seedha paste box mein copy-paste kar sakte hain.'
      });
    }

    const markdownText = formatConversationToMarkdown(result.title, result.messages);

    return res.json({
      success: true,
      title: result.title,
      messageCount: result.messages.length,
      markdown: markdownText
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Share link fetch karne mein truti hui.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SaafPDF', version: '1.0.0' });
});

// Start server on loopback interface
let server = null;
if (require.main === module) {
  server = app.listen(PORT, HOST, () => {
    console.log(`[SaafPDF] Server chal raha hai: http://${HOST}:${PORT}`);
    console.log(`[SaafPDF] Loopback interface par binded hai: ${HOST}`);
  });
}

module.exports = { app, server, validateShareUrl };
