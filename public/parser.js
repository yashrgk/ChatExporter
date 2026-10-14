/**
 * SaafPDF - Parser Engine
 * Handles Markdown, TSV tables, LaTeX display & inline math, headings with math,
 * lists, code blocks, and multi-language prose.
 */

(function(global) {
  'use strict';

  // Math Warning Collector
  let mathWarnings = [];

  function getMathWarnings() {
    return [...mathWarnings];
  }

  function clearMathWarnings() {
    mathWarnings = [];
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Safe KaTeX render helper
   */
  function renderLatex(formula, isDisplay = false) {
    const trimmed = formula.trim();
    if (!trimmed) return '';

    // KaTeX check
    const katexObj = typeof katex !== 'undefined' ? katex : (global.katex || null);
    if (!katexObj) {
      // Fallback if KaTeX not loaded
      return `<code class="math-no-katex ${isDisplay ? 'display-math-raw' : 'inline-math-raw'}">${escapeHtml(trimmed)}</code>`;
    }

    try {
      return katexObj.renderToString(trimmed, {
        displayMode: isDisplay,
        throwOnError: true,
        output: 'htmlAndMathml',
        strict: false
      });
    } catch (err) {
      // Log warning to list
      mathWarnings.push({
        formula: trimmed,
        isDisplay,
        message: err.message || 'LaTeX parsing error'
      });
      // Fallback: Return clean formatted raw formula without raw LaTeX error text in print
      const displayClass = isDisplay ? 'formula-fallback-display' : 'formula-fallback-inline';
      return `<span class="math-syntax-fallback ${displayClass}" title="LaTeX Warning: ${escapeHtml(err.message)}">${escapeHtml(trimmed)}</span>`;
    }
  }

  /**
   * Parse inline formatting: math, bold, italic, code
   */
  function parseInline(text) {
    if (!text) return '';

    // Step 1: Protect escaped dollars \$
    const ESCAPED_DOLLAR = '___ESCAPED_DOLLAR___';
    let processed = text.replace(/\\\$/g, ESCAPED_DOLLAR);

    // Step 2: Extract & render inline math: \(...\) and $...$
    // Match \(...\)
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
      return renderLatex(formula, false);
    });

    // Match $...$ (ensure not preceded/followed by digits for currency like $100 if possible, but standard latex delimiter is $)
    // We match $formula$ where formula doesn't start/end with space and doesn't span multiple paragraphs
    processed = processed.replace(/\$([^\$\n\r]+?)\$/g, (match, formula) => {
      // If formula starts with space or ends with space, treat as regular text
      if (formula.startsWith(' ') && formula.endsWith(' ')) {
        return match;
      }
      return renderLatex(formula, false);
    });

    // Step 3: Inline code `...`
    processed = processed.replace(/`([^`\n]+?)`/g, (match, code) => {
      return `<code>${escapeHtml(code)}</code>`;
    });

    // Step 4: Bold **...** and __...__
    processed = processed.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

    // Step 5: Italic *...* and _..._
    processed = processed.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

    // Restore escaped dollar
    processed = processed.replace(new RegExp(ESCAPED_DOLLAR, 'g'), '$');

    return processed;
  }

  /**
   * Parse Markdown Table
   */
  function parseMarkdownTable(lines) {
    if (lines.length < 2) return null;

    // Check if line 1 has pipes and line 2 is separator row
    const headerLine = lines[0].trim();
    const separatorLine = lines[1].trim();

    if (!headerLine.includes('|') || !separatorLine.includes('|')) return null;

    // Separator line must match markdown separator pattern like |:---|---:|:---:|---|
    const sepPattern = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/;
    if (!sepPattern.test(separatorLine)) return null;

    function splitRow(row) {
      // Remove leading/trailing pipe
      let trimmed = row.trim();
      if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
      if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
      return trimmed.split('|').map(cell => cell.trim());
    }

    const headers = splitRow(headerLine);
    const sepCells = splitRow(separatorLine);
    const numCols = Math.max(headers.length, sepCells.length);

    // Determine column alignments
    const alignments = sepCells.map(cell => {
      const c = cell.trim();
      const leftColon = c.startsWith(':');
      const rightColon = c.endsWith(':');
      if (leftColon && rightColon) return 'center';
      if (rightColon) return 'right';
      return 'left';
    });

    let html = '<div class="table-container"><table class="saaf-table">';
    html += '<thead><tr>';
    for (let c = 0; c < numCols; c++) {
      const headerText = headers[c] || '';
      const align = alignments[c] || 'left';
      html += `<th style="text-align: ${align}">${parseInline(headerText)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let r = 2; r < lines.length; r++) {
      const rowLine = lines[r].trim();
      if (!rowLine.includes('|')) continue;
      const cells = splitRow(rowLine);
      html += '<tr>';
      for (let c = 0; c < numCols; c++) {
        const cellText = cells[c] !== undefined ? cells[c] : '';
        const align = alignments[c] || 'left';
        html += `<td style="text-align: ${align}">${parseInline(cellText)}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Parse TSV (Tab Separated Values) block
   */
  function parseTsvTable(lines) {
    if (lines.length < 2) return null;
    
    // Check if every line contains at least one tab
    const rows = lines.map(line => line.split('\t').map(c => c.trim()));
    if (rows.some(r => r.length < 2)) return null;

    const maxCols = Math.max(...rows.map(r => r.length));
    if (maxCols < 2) return null;

    let html = '<div class="table-container"><table class="saaf-table tsv-table">';
    html += '<thead><tr>';
    const headerRow = rows[0];
    for (let c = 0; c < maxCols; c++) {
      const val = headerRow[c] || `Column ${c + 1}`;
      html += `<th>${parseInline(val)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      html += '<tr>';
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] !== undefined ? row[c] : '';
        html += `<td>${parseInline(val)}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Main Document Parser
   */
  function parseDocument(rawText) {
    clearMathWarnings();
    if (!rawText || !rawText.trim()) {
      return '';
    }

    // Normalize line breaks
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Step 1: Pre-extract Display Math $$...$$ and \[...\]
    // Replace them with placeholders so internal characters (#, |, etc.) don't interfere with block parsing
    const displayMathBlocks = [];
    const DISPLAY_PLACEHOLDER = '___DISPLAY_MATH_BLOCK_';

    // Match $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const idx = displayMathBlocks.length;
      displayMathBlocks.push(formula);
      return `\n\n${DISPLAY_PLACEHOLDER}${idx}___\n\n`;
    });

    // Match \[...\]
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      const idx = displayMathBlocks.length;
      displayMathBlocks.push(formula);
      return `\n\n${DISPLAY_PLACEHOLDER}${idx}___\n\n`;
    });

    // Step 2: Pre-extract Code Blocks ```...```
    const codeBlocks = [];
    const CODE_PLACEHOLDER = '___CODE_BLOCK_';
    text = text.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang.trim(), code });
      return `\n\n${CODE_PLACEHOLDER}${idx}___\n\n`;
    });

    // Step 3: Split into blocks by double newlines or line-by-line inspection
    const rawLines = text.split('\n');
    const outElements = [];
    let lineIdx = 0;

    while (lineIdx < rawLines.length) {
      let line = rawLines[lineIdx];
      let trimmed = line.trim();

      // Skip blank lines
      if (!trimmed) {
        lineIdx++;
        continue;
      }

      // Check Display Math placeholder
      const displayMathMatch = trimmed.match(new RegExp(`^${DISPLAY_PLACEHOLDER}(\\d+)___$`));
      if (displayMathMatch) {
        const formulaIdx = parseInt(displayMathMatch[1], 10);
        const formula = displayMathBlocks[formulaIdx] || '';
        const rendered = renderLatex(formula, true);
        outElements.push(
          `<div class="formula-block" data-formula="${escapeHtml(formula)}">
            <div class="formula-container">${rendered}</div>
          </div>`
        );
        lineIdx++;
        continue;
      }

      // Check Code Block placeholder
      const codeMatch = trimmed.match(new RegExp(`^${CODE_PLACEHOLDER}(\\d+)___$`));
      if (codeMatch) {
        const blockIdx = parseInt(codeMatch[1], 10);
        const { lang, code } = codeBlocks[blockIdx];
        outElements.push(
          `<div class="code-wrapper">
            <div class="code-header">
              <span class="code-badge">${escapeHtml(lang || 'code')}</span>
            </div>
            <pre class="saaf-code"><code>${escapeHtml(code)}</code></pre>
          </div>`
        );
        lineIdx++;
        continue;
      }

      // Check Markdown Headings: # to ######
      // NOTE: This satisfies acceptance test 4: `##### Step 3(a): Differentiate $p(x) = e^{3x}$`
      // Heading '#' is parsed as heading tag <h5> and NEVER fed to LaTeX math mode!
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const parsedContent = parseInline(headingText);
        outElements.push(`<h${level} class="saaf-h saaf-h${level}">${parsedContent}</h${level}>`);
        lineIdx++;
        continue;
      }

      // Check Blockquotes: > ...
      if (line.startsWith('>')) {
        let quoteLines = [];
        while (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('>')) {
          quoteLines.push(rawLines[lineIdx].replace(/^>\s?/, ''));
          lineIdx++;
        }
        const quoteContent = quoteLines.map(parseInline).join('<br/>');
        outElements.push(`<blockquote class="saaf-quote">${quoteContent}</blockquote>`);
        continue;
      }

      // Check Horizontal Rules: --- or ***
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
        outElements.push('<hr class="saaf-divider" />');
        lineIdx++;
        continue;
      }

      // Check Markdown Tables: lines with '|'
      if (trimmed.includes('|') && lineIdx + 1 < rawLines.length && rawLines[lineIdx + 1].includes('|')) {
        let tableLines = [];
        while (lineIdx < rawLines.length && rawLines[lineIdx].trim().includes('|')) {
          tableLines.push(rawLines[lineIdx]);
          lineIdx++;
        }
        const tableHtml = parseMarkdownTable(tableLines);
        if (tableHtml) {
          outElements.push(tableHtml);
          continue;
        } else {
          // If not a valid markdown table, backtrack and treat as paragraph lines
          lineIdx -= tableLines.length;
        }
      }

      // Check TSV Tables: consecutive lines with '\t'
      if (line.includes('\t')) {
        let tsvLines = [];
        while (lineIdx < rawLines.length && rawLines[lineIdx].includes('\t')) {
          tsvLines.push(rawLines[lineIdx]);
          lineIdx++;
        }
        if (tsvLines.length >= 2) {
          const tsvHtml = parseTsvTable(tsvLines);
          if (tsvHtml) {
            outElements.push(tsvHtml);
            continue;
          }
        }
        // If not table, backtrack
        lineIdx -= tsvLines.length;
      }

      // Check Lists: Ordered (1. ) or Unordered (* , - , + )
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (listMatch) {
        const isOrdered = /^\d+\./.test(listMatch[2]);
        const listTag = isOrdered ? 'ol' : 'ul';
        let listItems = [];

        while (lineIdx < rawLines.length) {
          const curLine = rawLines[lineIdx];
          const itemMatch = curLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
          if (itemMatch) {
            listItems.push(`<li>${parseInline(itemMatch[3])}</li>`);
            lineIdx++;
          } else if (curLine.trim() && (curLine.startsWith('    ') || curLine.startsWith('\t'))) {
            // Continuation of previous list item
            if (listItems.length > 0) {
              const prev = listItems.pop();
              listItems.push(prev.replace(/<\/li>$/, ` ${parseInline(curLine.trim())}</li>`));
            }
            lineIdx++;
          } else {
            break;
          }
        }

        outElements.push(`<${listTag} class="saaf-list ${isOrdered ? 'saaf-ol' : 'saaf-ul'}">${listItems.join('')}</${listTag}>`);
        continue;
      }

      // Otherwise, Paragraph
      let paraLines = [];
      while (lineIdx < rawLines.length) {
        const pLine = rawLines[lineIdx];
        const pTrim = pLine.trim();
        if (!pTrim) break;
        // Check if next line is a special block (heading, table, list, code block, display math)
        if (pLine.match(/^(#{1,6})\s+/) || 
            pTrim.startsWith('>') || 
            /^(\*{3,}|-{3,}|_{3,})$/.test(pTrim) ||
            pTrim.startsWith(DISPLAY_PLACEHOLDER) ||
            pTrim.startsWith(CODE_PLACEHOLDER) ||
            pLine.match(/^(\s*)([-*+]|\d+\.)\s+/) ||
            (pTrim.includes('|') && lineIdx + 1 < rawLines.length && rawLines[lineIdx + 1].includes('|')) ||
            pLine.includes('\t')) {
          break;
        }
        paraLines.push(pLine);
        lineIdx++;
      }

      if (paraLines.length > 0) {
        const content = paraLines.map(parseInline).join(' ');
        outElements.push(`<p class="saaf-p">${content}</p>`);
      }
    }

    const rawHtml = outElements.join('\n');

    // Sanitize with DOMPurify if available in browser
    const purifyObj = typeof DOMPurify !== 'undefined' ? DOMPurify : (global.DOMPurify || null);
    if (purifyObj && typeof purifyObj.sanitize === 'function') {
      return purifyObj.sanitize(rawHtml, {
        ADD_TAGS: ['annotation', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mover', 'munder', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mpadded', 'mspace', 'mstyle'],
        ADD_ATTR: ['xmlns', 'display', 'class', 'style', 'aria-hidden', 'role', 'viewbox', 'd', 'fill', 'stroke', 'width', 'height']
      });
    }

    return rawHtml;
  }

  // Export for browser & node.js
  const SaafParser = {
    parseDocument,
    parseInline,
    renderLatex,
    parseMarkdownTable,
    parseTsvTable,
    getMathWarnings,
    clearMathWarnings
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaafParser;
  } else {
    global.SaafParser = SaafParser;
  }
})(typeof window !== 'undefined' ? window : global);
