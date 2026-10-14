/**
 * SaafPDF - Main Application Controller
 */

(function() {
  'use strict';

  // State
  let currentZoom = 1;
  let debounceTimer = null;
  const DEFAULT_TITLE = 'SaafPDF Document';

  // Sample AI Chat Response Data
  const SAMPLE_RESPONSE = `# AI Response: Calculus & Model Comparison Analysis

AI Chatbots ka complex mathematical response aur tabular comparison yahan format kiya gaya hai. Isme Hindi/English mixed prose, step-by-step calculus, wide tables, aur TSV data shamil hai.

##### Step 3(a): Differentiate $p(x) = e^{3x} \\cdot \\sin(2x)$ with respect to $x$

Product rule apply karte hain:
Agar $u(x) = e^{3x}$ aur $v(x) = \\sin(2x)$, to derivative formula yeh hoga:
$$ \\frac{d}{dx}[u \\cdot v] = u'v + uv' $$

Ab derivatives calculate karte hain:
* $u'(x) = 3e^{3x}$
* $v'(x) = 2\\cos(2x)$

Isliye total derivative hoga:
$$ p'(x) = 3e^{3x}\\sin(2x) + 2e^{3x}\\cos(2x) = e^{3x} \\left( 3\\sin(2x) + 2\\cos(2x) \\right) $$

---

### Bahut Lamba Integral Formula (Auto-Scaling Test)

Yeh ek lamba multivariable definite integral hai jiska font size page width ke anusar bina cut hue scale hoga:

$$ \\int_{-\\infty}^{\\infty} e^{-\\alpha x^2 + \\beta x + \\gamma} \\cos(\\omega x) \\, dx = \\sqrt{\\frac{\\pi}{\\alpha}} \\exp\\left( \\frac{\\beta^2 - \\omega^2}{4\\alpha} + \\gamma \\right) \\cos\\left( \\frac{\\beta \\omega}{2\\alpha} \\right) + \\sum_{k=1}^{n} \\frac{\\partial^k}{\\partial \\lambda^k} \\left[ \\frac{\\Gamma(k + \\frac{1}{2})}{\\sqrt{\\pi} \\cdot k!} \\right] $$

Matrix expression with bracket alignment:

\\[ \\mathbf{M} = \\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}, \\quad \\det(\\mathbf{M}) = a_{11}(a_{22}a_{33} - a_{23}a_{32}) - a_{12}(a_{21}a_{33} - a_{23}a_{31}) + a_{13}(a_{21}a_{32} - a_{22}a_{31}) \\]

---

### AI LLM Capabilities Comparison Table (5 Columns)

Neeche di gayi table 5 columns wali hai jo mobile aur A4 sheet par bina truncate hue cleanly fit hogi:

| Model Name | Context Window | Math / LaTeX Support | Table Rendering | Export Recommendation |
| :--- | :---: | :---: | :---: | :--- |
| GPT-4o | 128k Tokens | Excellent ($...$ & $$...$$) | Markdown Pipes | Best for analytical reports |
| Gemini 1.5 Pro | 1M+ Tokens | Advanced Multiline | TSV & Markdown | Best for massive context docs |
| Claude 3.5 Sonnet | 200k Tokens | Superior Precision | Semantic Tables | Best for clean code & proofs |
| DeepSeek R1 | 64k Tokens | Deep Math Reasoning | Markdown Tables | Outstanding for complex steps |

---

### Tab-Separated Values (TSV) Example

Agar user spreadsheet ya chatbot se raw TSV paste kare:

Parameter\tBaseline Score\tOptimized Score\tImprovement\tStatus
Latency\t340ms\t95ms\t+72%\tPassed
Precision\t88.4%\t96.2%\t+8.8%\tPassed
Throughput\t120 req/s\t450 req/s\t+275%\tPassed

---

> [!NOTE]
> SaafPDF aapke response ko 100% locally format karta hai. Koi bhi private text kisi remote server ya external analytics par upload nahi hota.`;

  const SAMPLE_GEMINI = `# Gemini 1.5 Pro: Multivariable Optimization & Matrix Decompositions

Google Gemini dwara generate kiya gaya complex analytical response. Isme multiple mathematical steps, wide comparison tables, TSV data aur eigenvalues calculations shamil hain.

##### Step 1: Characteristic Polynomial aur Eigenvalues $A \\mathbf{v} = \\lambda \\mathbf{v}$

Matrix $A$ ka determinant formulate karte hain:
$$ \\det(A - \\lambda I) = 0 $$

Given 3x3 symmetric matrix:
\\[ A = \\begin{pmatrix} 4 & 1 & 0 \\\\ 1 & 4 & 1 \\\\ 0 & 1 & 4 \\end{pmatrix} \\]

Characteristic equation compute karne par:
$$ (4 - \\lambda) \\left[ (4 - \\lambda)^2 - 1 \\right] - 1(4 - \\lambda) = 0 $$
$$ (4 - \\lambda) \\left( \\lambda^2 - 8\\lambda + 14 \\right) = 0 $$

Isse exact analytical eigenvalues prapt hoti hain:
* $\\lambda_1 = 4$
* $\\lambda_2 = 4 + \\sqrt{2}$
* $\\lambda_3 = 4 - \\sqrt{2}$

---

### Gemini Multimodal Vision & Reasoning Performance Comparison

| Model Architecture | Input Modalities | Context Length | MMLU Score | GSM8K Math Accuracy |
| :--- | :--- | :---: | :---: | :--- |
| Gemini 1.5 Ultra | Text, Vision, Audio, Video | 2,000,000 Tokens | 90.04% | 94.4% (Multi-step reasoning) |
| Gemini 1.5 Pro | Text, Code, Vision, Audio | 1,000,000 Tokens | 85.9% | 91.7% (Chain of thought) |
| Gemini 1.5 Flash | Lightweight Realtime Edge | 1,000,000 Tokens | 78.9% | 84.2% (Low latency inference) |
| Claude 3.5 Sonnet | Text, Code, High-res Vision | 200,000 Tokens | 88.7% | 92.3% (Precision coding) |

---

### Tab-Separated Benchmark Results (Gemini TPU v5p Cluster vs GPU)

Metric\tTPU v5p Cluster\tNVIDIA H100 GPU\tSpeedup\tEfficiency Status
Time to First Token\t42ms\t58ms\t1.38x\tPassed
Sustained Decoding\t185 tok/s\t142 tok/s\t1.30x\tPassed
Energy Consumption\t310W\t450W\t1.45x\tPassed

---

> [!TIP]
> Gemini shared links (\`gemini.google.com/share/...\` ya \`g.co/gemini/share/...\`) bina kisi header overflow error ke direct A4 format mein convert hote hain.`;

  const SAMPLE_CLAUDE = `# Claude 3.5 Sonnet: Quantum State Evolution & Functional Analysis

Anthropic Claude dwara provide kiya gaya formal mathematical proof aur step-by-step derivation.

### 👤 Human:
Can you derive the time-dependent Schrödinger equation and provide a tabular comparison of quantum state representations?

---

### 🤖 Assistant:
Certainly. Let us begin with the fundamental postulate of quantum mechanics connecting energy to the Hamiltonian operator $\\hat{H}$.

##### Step 1: State Vector and Unitary Time Evolution Operator $U(t)$

In Hilbert space $\\mathcal{H}$, any physical quantum state $|\\psi(t)\\rangle$ evolves according to the unitary operator:
$$ |\\psi(t)\\rangle = \\hat{U}(t, t_0) |\\psi(t_0)\\rangle $$

Where unitary condition enforces preservation of total probability:
$$ \\hat{U}^\\dagger \\hat{U} = \\hat{I}, \\quad \\langle \\psi(t) | \\psi(t) \\rangle = 1 $$

##### Step 2: Infinitesimal Time Evolution & Generator of Translations

Taking the derivative with respect to time $t$:
$$ i\\hbar \\frac{\\partial}{\\partial t} |\\psi(t)\\rangle = \\hat{H} |\\psi(t)\\rangle $$

In coordinate space representation $\\langle \\mathbf{r} | \\psi(t) \\rangle = \\Psi(\\mathbf{r}, t)$, this yields the canonical differential equation:
$$ i\\hbar \\frac{\\partial \\Psi(\\mathbf{r}, t)}{\\partial t} = \\left( -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}, t) \\right) \\Psi(\\mathbf{r}, t) $$

---

### Quantum Mechanics Formalisms Comparison Table

| Formalism | State Description | Observables Dynamic | Evolution Equation | Primary Application |
| :--- | :--- | :--- | :--- | :--- |
| Schrödinger Picture | Time-dependent $|\\psi(t)\\rangle$ | Stationary operators $\\hat{A}$ | $i\\hbar \\partial_t |\\psi\\rangle = \\hat{H}|\\psi\\rangle$ | Wave packet spreading & atomic orbitals |
| Heisenberg Picture | Fixed state $|\\psi(0)\\rangle$ | Time-dependent $\\hat{A}(t)$ | $\\frac{d\\hat{A}}{dt} = \\frac{i}{\\hbar}[\\hat{H}, \\hat{A}] + \\partial_t \\hat{A}$ | Quantum field theory & canonical quantization |
| Dirac (Interaction) | Evolving under $\\hat{V}_I(t)$ | Evolving under $\\hat{H}_0$ | $i\\hbar \\partial_t |\\psi_I\\rangle = \\hat{V}_I(t)|\\psi_I\\rangle$ | Perturbation theory & scattering S-matrix |
| Feynman Path Integral | Propagator amplitude $K(b,a)$ | Classical action $S[x]$ | $K(b,a) = \\int \\mathcal{D}[x(t)] e^{iS/\\hbar}$ | Quantum electrodynamics & lattice gauge |

---

> [!NOTE]
> Claude shared conversations (\`claude.ai/share/...\`) aur direct copied chat text dono SaafPDF mein perfectly render hote hain.`;

  // DOM Elements
  const chatInput = document.getElementById('chat-input');
  const docTitleInput = document.getElementById('doc-title-input');
  const previewDoc = document.getElementById('preview-document');
  const previewTitle = document.getElementById('preview-title');
  const previewDate = document.getElementById('preview-date');
  const emptyState = document.getElementById('empty-state');
  const wordCountEl = document.getElementById('word-count');
  const charCountEl = document.getElementById('char-count');
  const mathWarningBanner = document.getElementById('math-warning-banner');

  const btnPrint = document.getElementById('btn-print');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnSample = document.getElementById('btn-sample');
  const btnClear = document.getElementById('btn-clear');
  const btnCopyPreview = document.getElementById('btn-copy-preview');
  const themeToggle = document.getElementById('theme-toggle');

  // Quick Demo Buttons
  const btnDemoChatgpt = document.getElementById('btn-demo-chatgpt');
  const btnDemoGemini = document.getElementById('btn-demo-gemini');
  const btnDemoClaude = document.getElementById('btn-demo-claude');
  const btnFormatChat = document.getElementById('btn-format-chat');

  // Share Import Modal Elements
  const btnOpenImport = document.getElementById('btn-open-import');
  const importModal = document.getElementById('import-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelImport = document.getElementById('btn-cancel-import');
  const btnSubmitImport = document.getElementById('btn-submit-import');
  const btnSubmitImportText = document.getElementById('btn-submit-import-text');
  const shareUrlInput = document.getElementById('share-url-input');
  const rawChatInput = document.getElementById('raw-chat-input');
  const importStatus = document.getElementById('import-status');
  const modalTabLink = document.getElementById('modal-tab-link');
  const modalTabText = document.getElementById('modal-tab-text');
  const paneLinkImport = document.getElementById('pane-link-import');
  const paneTextImport = document.getElementById('pane-text-import');
  let modalActiveTab = 'link'; // 'link' or 'text'

  // Zoom Elements
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const zoomLabel = document.getElementById('zoom-label');
  const a4Sheet = document.getElementById('a4-sheet');

  // Mobile Tabs
  const mobileTabs = document.querySelectorAll('.tab-btn');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');

  /**
   * Safe Filename generator from Title
   */
  function getSafeFilename() {
    const rawTitle = (docTitleInput.value || '').trim() || DEFAULT_TITLE;
    const sanitized = rawTitle
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '');
    return sanitized || 'SaafPDF_Document';
  }

  /**
   * Toast notification system
   */
  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Update text statistics
   */
  function updateStats(text) {
    const trimmed = (text || '').trim();
    const chars = trimmed.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    
    if (wordCountEl) wordCountEl.textContent = `${words} Shabd (Words)`;
    if (charCountEl) charCountEl.textContent = `${chars} Akshar (Chars)`;
  }

  /**
   * Update Preview Rendering
   */
  function updatePreview() {
    const rawContent = chatInput.value;
    const titleVal = (docTitleInput.value || '').trim();

    updateStats(rawContent);

    // Update document title display
    if (previewTitle) {
      previewTitle.textContent = titleVal || 'AI Chat Document';
    }

    if (!rawContent.trim()) {
      if (emptyState) emptyState.style.display = 'flex';
      if (previewDoc) previewDoc.innerHTML = '';
      if (mathWarningBanner) mathWarningBanner.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Parse Markdown, TSV, KaTeX, and Tables
    const parsedHtml = SaafParser.parseDocument(rawContent);
    if (previewDoc) {
      previewDoc.innerHTML = parsedHtml;
    }

    // Check for LaTeX Warnings
    const warnings = SaafParser.getMathWarnings();
    if (mathWarningBanner) {
      if (warnings.length > 0) {
        mathWarningBanner.style.display = 'block';
        mathWarningBanner.innerHTML = `⚠️ <strong>Math Warning:</strong> ${warnings.length} formula(s) mein syntax error hai. PDF mein error text chhupakar raw formula preserve kiya gaya hai.`;
      } else {
        mathWarningBanner.style.display = 'none';
      }
    }

    // Auto scale formulas & responsive tables
    if (window.SaafScaler) {
      window.SaafScaler.autoFitAll(previewDoc);
    }
  }

  /**
   * Check if text is a standalone share URL
   */
  function isStandaloneShareLink(text) {
    if (!text) return null;
    const clean = text.trim();
    const regex = /^(https?:\/\/)?(chatgpt\.com\/share\/[a-zA-Z0-9_\-]+|chat\.openai\.com\/share\/[a-zA-Z0-9_\-]+|gemini\.google\.com\/share\/[a-zA-Z0-9_\-]+|share\.gemini\.google\/[a-zA-Z0-9_\-]+|g\.co\/gemini\/share\/[a-zA-Z0-9_\-]+|claude\.ai\/(?:share|chat)\/[a-zA-Z0-9_\-]+)(\?[^\s]*)?$/i;
    if (regex.test(clean)) {
      return clean.startsWith('http') ? clean : ('https://' + clean);
    }
    return null;
  }

  let isAutoImporting = false;

  /**
   * Debounced Preview Trigger for fast typing + Auto Link Detection
   */
  function triggerDebouncedPreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const rawContent = chatInput.value.trim();
      const detectedLink = isStandaloneShareLink(rawContent);

      if (detectedLink && !isAutoImporting) {
        autoImportFromTextarea(detectedLink);
        return;
      }

      updatePreview();
    }, 150);
  }

  /**
   * Automatically import when user pastes a share link into the editor
   */
  async function autoImportFromTextarea(url) {
    const banner = document.getElementById('link-detect-banner');
    if (banner) banner.style.display = 'flex';
    isAutoImporting = true;

    try {
      showToast('Share link pehchana gaya! Puri chat import ho rahi hai...', 'info', 2500);

      const response = await fetch('/api/import-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Chat import nahi ho saki.');
      }

      if (data.title && docTitleInput) {
        docTitleInput.value = data.title;
      }

      if (data.markdown && chatInput) {
        chatInput.value = data.markdown;
      }

      updatePreview();
      if (data.isPartial) {
        showToast(`Gemini Title mila: "${data.title}"! Puri chat copy-paste karne ke liye Direct Paste use karein.`, 'info', 5000);
      } else {
        showToast(`Puri chat import ho gayi (${data.messageCount} messages)! PDF banayein ready hai.`, 'success', 4000);
      }

    } catch (err) {
      showToast(`Link import error: ${err.message}`, 'error', 4500);
      updatePreview();
    } finally {
      if (banner) banner.style.display = 'none';
      isAutoImporting = false;
    }
  }

  /**
   * Apply Zoom to A4 Preview Sheet
   */
  function applyZoom(newZoom) {
    currentZoom = Math.max(0.6, Math.min(1.2, newZoom));
    if (a4Sheet) {
      a4Sheet.style.transform = `scale(${currentZoom})`;
      a4Sheet.style.transformOrigin = 'top center';
    }
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
    }
    // Re-scale formulas for new preview dimensions
    if (window.SaafScaler) {
      window.SaafScaler.autoFitAll(previewDoc);
    }
  }

  /**
   * PDF Generator: Browser Print / Save as PDF
   */
  function handlePrintPdf() {
    const rawContent = chatInput.value.trim();
    if (!rawContent) {
      showToast('Kripya pehle chat response paste karein! Khali input par PDF nahi ban sakti.', 'warning');
      chatInput.focus();
      return;
    }

    // Set page document title so browser defaults to user's title for PDF filename
    const safeName = getSafeFilename();
    const originalDocTitle = document.title;
    document.title = safeName;

    btnPrint.disabled = true;
    btnPrint.innerHTML = '<span class="spinner"></span> <span>Preparing...</span>';

    // Recalculate formula fitting for A4 width (680px)
    if (window.SaafScaler) {
      window.SaafScaler.autoFitAll(previewDoc, 680);
    }

    setTimeout(() => {
      window.print();
      btnPrint.disabled = false;
      btnPrint.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> <span>PDF banayein</span>`;
      document.title = originalDocTitle;
      // Restore normal screen scaling
      if (window.SaafScaler) {
        window.SaafScaler.autoFitAll(previewDoc);
      }
    }, 200);
  }

  /**
   * Direct PDF Download using html2pdf.js
   */
  function handleDownloadPdf() {
    const rawContent = chatInput.value.trim();
    if (!rawContent) {
      showToast('Kripya pehle chat response paste karein!', 'warning');
      chatInput.focus();
      return;
    }

    if (typeof html2pdf === 'undefined') {
      showToast('html2pdf library load nahi hui. Save as PDF (Print) ka istemal karein.', 'warning');
      handlePrintPdf();
      return;
    }

    const safeName = getSafeFilename();
    btnDownloadPdf.disabled = true;
    btnDownloadPdf.innerHTML = '<span class="spinner"></span> <span>Generating...</span>';

    // Ensure A4 fitting
    if (window.SaafScaler) {
      window.SaafScaler.autoFitAll(previewDoc, 680);
    }

    const element = document.getElementById('a4-sheet');
    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     `${safeName}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save()
      .then(() => {
        showToast(`PDF safaltapoorvak download ho gayi: ${safeName}.pdf`, 'success');
      })
      .catch((err) => {
        showToast('PDF export error: ' + (err.message || 'Truti hui'), 'error');
      })
      .finally(() => {
        btnDownloadPdf.disabled = false;
        btnDownloadPdf.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>Download PDF</span>`;
        if (window.SaafScaler) {
          window.SaafScaler.autoFitAll(previewDoc);
        }
      });
  }

  /**
   * Share Link Import Handler
   */
  async function handleImportShare() {
    const rawUrl = (shareUrlInput.value || '').trim();
    if (!rawUrl) {
      importStatus.className = 'import-status-box error';
      importStatus.textContent = 'Kripya ChatGPT, Gemini ya Claude ka share link dalein.';
      shareUrlInput.focus();
      return;
    }

    // Client-side quick validation
    if (!rawUrl.startsWith('https://')) {
      importStatus.className = 'import-status-box error';
      importStatus.textContent = 'Keval HTTPS links accept kiye jaate hain (https://...).';
      return;
    }

    importStatus.className = 'import-status-box loading';
    importStatus.innerHTML = '<span class="spinner"></span> <span>Puri chat import ho rahi hai... Kripya intezar karein.</span>';
    btnSubmitImport.disabled = true;

    try {
      const response = await fetch('/api/import-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Chat import nahi ho saki.');
      }

      // Populate Editor & Preview
      if (data.title && docTitleInput) {
        docTitleInput.value = data.title;
      }

      if (data.markdown && chatInput) {
        chatInput.value = data.markdown;
      }

      updatePreview();

      if (data.isPartial) {
        importStatus.className = 'import-status-box success';
        importStatus.innerHTML = `✅ Gemini Title mila: "<strong>${data.title}</strong>"!<br><small style="display:block;margin-top:4px;">Browser security ke kaaran conversation body ko copy karke yahan paste karein.</small><button id="btn-switch-to-text-tab" style="margin-top:8px;padding:5px 10px;font-size:0.8rem;cursor:pointer;border-radius:4px;border:1px solid currentColor;background:rgba(79,70,229,0.1);font-weight:600;">📋 Direct Chat Paste Tab Par Switch Karein</button>`;
        showToast(`Gemini Title mila: "${data.title}". Direct Paste mein chat paste karein.`, 'info', 5000);
        setTimeout(() => {
          const switchBtn = document.getElementById('btn-switch-to-text-tab');
          if (switchBtn) {
            switchBtn.addEventListener('click', () => switchModalTab('text'));
          }
        }, 50);
      } else {
        importStatus.className = 'import-status-box success';
        importStatus.innerHTML = `✅ ${data.messageCount || 'Kayi'} messages safaltapoorvak import ho gaye!`;
        showToast(`Puri chat import ho gayi (${data.messageCount || ''} messages)!`, 'success');
        setTimeout(() => {
          closeImportModal();
        }, 1000);
      }

    } catch (err) {
      importStatus.className = 'import-status-box error';
      const errMsg = err.message || 'Share link fetch karne mein truti hui.';
      importStatus.innerHTML = `<span>❌ ${errMsg}</span>`;
      
      // If Claude or Cloudflare blocks, show hint to switch to Direct Paste tab
      if (errMsg.includes('Cloudflare') || errMsg.includes('Claude') || rawUrl.includes('claude.ai') || rawUrl.includes('gemini')) {
        importStatus.innerHTML += `<br><button id="btn-switch-to-text-tab" style="margin-top:8px;padding:4px 8px;font-size:0.75rem;cursor:pointer;border-radius:4px;border:1px solid currentColor;background:transparent;">📋 Direct Paste Tab Par Switch Karein</button>`;
        setTimeout(() => {
          const switchBtn = document.getElementById('btn-switch-to-text-tab');
          if (switchBtn) {
            switchBtn.addEventListener('click', () => switchModalTab('text'));
          }
        }, 50);
      }
    } finally {
      btnSubmitImport.disabled = false;
    }
  }

  /**
   * Direct Chat Text Import Handler (Handles Claude, Gemini, ChatGPT copied text)
   */
  function handleImportText() {
    const rawText = (rawChatInput.value || '').trim();
    if (!rawText) {
      importStatus.className = 'import-status-box error';
      importStatus.textContent = 'Kripya chat text yahan paste karein.';
      rawChatInput.focus();
      return;
    }

    importStatus.className = 'import-status-box loading';
    importStatus.innerHTML = '<span class="spinner"></span> <span>AI Chat format ki ja rahi hai...</span>';

    try {
      const formatted = window.SaafParser && typeof window.SaafParser.formatAiChatText === 'function'
        ? window.SaafParser.formatAiChatText(rawText)
        : rawText;

      if (chatInput) {
        chatInput.value = formatted;
      }

      // Try extracting title from first line of formatted markdown
      const titleMatch = formatted.match(/^#\s+([^\n]+)/);
      if (titleMatch && docTitleInput) {
        docTitleInput.value = titleMatch[1].trim();
      }

      updatePreview();

      importStatus.className = 'import-status-box success';
      importStatus.innerHTML = '✅ Chat text safaltapoorvak format & import ho gaya!';

      showToast('AI Chat clean format mein import ho gayi!', 'success');

      setTimeout(() => {
        closeImportModal();
      }, 800);
    } catch (err) {
      importStatus.className = 'import-status-box error';
      importStatus.textContent = `❌ ${err.message || 'Text format karne mein truti hui.'}`;
    }
  }

  /**
   * Universal Submit for Modal
   */
  function handleModalSubmit() {
    if (modalActiveTab === 'text') {
      handleImportText();
    } else {
      handleImportShare();
    }
  }

  /**
   * Modal Tab Switcher (Link vs Text)
   */
  function switchModalTab(tab) {
    modalActiveTab = tab;
    if (importStatus) {
      importStatus.className = 'import-status-box';
      importStatus.textContent = '';
    }

    if (tab === 'text') {
      if (modalTabLink) modalTabLink.classList.remove('active');
      if (modalTabText) modalTabText.classList.add('active');
      if (paneLinkImport) paneLinkImport.classList.add('tab-pane-hidden');
      if (paneTextImport) paneTextImport.classList.remove('tab-pane-hidden');
      if (btnSubmitImportText) btnSubmitImportText.textContent = 'Format & Import Karein';
      if (rawChatInput) rawChatInput.focus();
    } else {
      if (modalTabLink) modalTabLink.classList.add('active');
      if (modalTabText) modalTabText.classList.remove('active');
      if (paneLinkImport) paneLinkImport.classList.remove('tab-pane-hidden');
      if (paneTextImport) paneTextImport.classList.add('tab-pane-hidden');
      if (btnSubmitImportText) btnSubmitImportText.textContent = 'Puri chat import karein';
      if (shareUrlInput) shareUrlInput.focus();
    }
  }

  function openImportModal() {
    if (importModal) {
      importModal.classList.add('open');
      switchModalTab('link');
      if (shareUrlInput) {
        shareUrlInput.value = '';
        shareUrlInput.focus();
      }
      if (rawChatInput) {
        rawChatInput.value = '';
      }
      if (importStatus) {
        importStatus.className = 'import-status-box';
        importStatus.textContent = '';
      }
    }
  }

  function closeImportModal() {
    if (importModal) {
      importModal.classList.remove('open');
    }
  }

  /**
   * Theme Switcher
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('saafpdf_theme', newTheme);
    
    if (themeToggle) {
      themeToggle.innerHTML = newTheme === 'dark' 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  /**
   * Mobile Tabs & Bottom Bar Switcher
   */
  function setupMobileTabs() {
    const mobileEditorBar = document.getElementById('mobile-editor-bar');
    const mobilePreviewBar = document.getElementById('mobile-preview-bar');
    const btnMobileDemo = document.getElementById('btn-mobile-demo');
    const btnMobileToPreview = document.getElementById('btn-mobile-to-preview');
    const btnMobileDownload = document.getElementById('btn-mobile-download');
    const btnMobilePrint = document.getElementById('btn-mobile-print');

    function switchMobileTab(target) {
      mobileTabs.forEach(t => {
        if (t.getAttribute('data-target') === target) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      if (target === 'editor') {
        if (editorPanel) editorPanel.classList.remove('tab-hidden');
        if (previewPanel) previewPanel.classList.add('tab-hidden');
        if (mobileEditorBar) mobileEditorBar.style.display = 'flex';
        if (mobilePreviewBar) mobilePreviewBar.style.display = 'none';
      } else if (target === 'preview') {
        if (editorPanel) editorPanel.classList.add('tab-hidden');
        if (previewPanel) previewPanel.classList.remove('tab-hidden');
        if (mobileEditorBar) mobileEditorBar.style.display = 'none';
        if (mobilePreviewBar) mobilePreviewBar.style.display = 'flex';
        // Auto-fit formulas and tables for mobile viewport
        setTimeout(() => {
          if (window.SaafScaler) window.SaafScaler.autoFitAll(previewDoc);
        }, 50);
      } else if (target === 'import') {
        openImportModal();
      }
    }

    mobileTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        switchMobileTab(target);
      });
    });

    // Mobile Bottom Bar Actions
    if (btnMobileDemo) {
      btnMobileDemo.addEventListener('click', () => {
        if (btnSample) btnSample.click();
      });
    }

    if (btnMobileToPreview) {
      btnMobileToPreview.addEventListener('click', () => {
        switchMobileTab('preview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (btnMobileDownload) {
      btnMobileDownload.addEventListener('click', handleDownloadPdf);
    }

    if (btnMobilePrint) {
      btnMobilePrint.addEventListener('click', handlePrintPdf);
    }
  }

  /**
   * Initialize App Events
   */
  function init() {
    // Restore Theme
    const savedTheme = localStorage.getItem('saafpdf_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle && savedTheme === 'dark') {
      themeToggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }

    // Set Date in preview
    if (previewDate) {
      previewDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    // Inputs listener
    if (chatInput) {
      chatInput.addEventListener('input', triggerDebouncedPreview);
    }
    if (docTitleInput) {
      docTitleInput.addEventListener('input', triggerDebouncedPreview);
    }

    // Button actions
    if (btnPrint) btnPrint.addEventListener('click', handlePrintPdf);
    // Quick Demo Buttons
    function loadSample(title, content, providerName) {
      if (docTitleInput) docTitleInput.value = title;
      if (chatInput) chatInput.value = content;
      updatePreview();
      showToast(`${providerName} sample load ho gaya!`, 'success');
      if (window.innerWidth <= 1024) {
        const previewTab = document.querySelector('.tab-btn[data-target="preview"]');
        if (previewTab) previewTab.click();
      }
    }

    if (btnSample) {
      btnSample.addEventListener('click', () => {
        loadSample('Calculus & LLM Comparison Notes', SAMPLE_RESPONSE, 'ChatGPT');
      });
    }

    if (btnDemoChatgpt) {
      btnDemoChatgpt.addEventListener('click', () => {
        loadSample('Calculus & LLM Comparison Notes', SAMPLE_RESPONSE, 'ChatGPT');
      });
    }

    if (btnDemoGemini) {
      btnDemoGemini.addEventListener('click', () => {
        loadSample('Gemini 1.5 Multivariable & Matrix Optimization', SAMPLE_GEMINI, 'Google Gemini');
      });
    }

    if (btnDemoClaude) {
      btnDemoClaude.addEventListener('click', () => {
        loadSample('Claude 3.5 Quantum State Evolution & Proofs', SAMPLE_CLAUDE, 'Anthropic Claude');
      });
    }

    // Format AI Chat Button (Turns raw pasted text with Human/Assistant or You said/ChatGPT said into clean markdown)
    if (btnFormatChat) {
      btnFormatChat.addEventListener('click', () => {
        if (!chatInput || !chatInput.value.trim()) {
          showToast('Pehle editor mein AI chat paste karein.', 'warning');
          return;
        }

        const raw = chatInput.value;
        const formatted = window.SaafParser && typeof window.SaafParser.formatAiChatText === 'function'
          ? window.SaafParser.formatAiChatText(raw)
          : raw;

        if (formatted !== raw) {
          chatInput.value = formatted;
          const titleMatch = formatted.match(/^#\s+([^\n]+)/);
          if (titleMatch && docTitleInput && !docTitleInput.value.trim()) {
            docTitleInput.value = titleMatch[1].trim();
          }
          updatePreview();
          showToast('AI Chat turns safaltapoorvak format ho gaye!', 'success');
        } else {
          showToast('Text already clean hai ya standard markdown format mein hai.', 'info');
        }
      });
    }

    // Auto-detect share link on paste in main editor
    if (chatInput) {
      chatInput.addEventListener('paste', (e) => {
        const pastedText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        const trimmed = pastedText.trim();
        if (
          (trimmed.startsWith('https://chatgpt.com/share/') ||
           trimmed.startsWith('https://chat.openai.com/share/') ||
           trimmed.startsWith('https://gemini.google.com/share/') ||
           trimmed.startsWith('https://g.co/gemini/share/') ||
           trimmed.startsWith('https://claude.ai/share/')) &&
          !trimmed.includes('\n')
        ) {
          // If a single link was pasted into editor, suggest importing full conversation
          setTimeout(() => {
            if (shareUrlInput) shareUrlInput.value = trimmed;
            openImportModal();
            showToast('AI Share link detect hua! "Puri chat import karein" dabayein.', 'info', 4500);
          }, 100);
        }
      });
    }

    // Clear button
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (chatInput) chatInput.value = '';
        if (docTitleInput) docTitleInput.value = '';
        updatePreview();
        showToast('Editor clear ho gaya.', 'info');
      });
    }

    // Copy Preview Text button
    if (btnCopyPreview) {
      btnCopyPreview.addEventListener('click', () => {
        if (previewDoc && previewDoc.innerText) {
          navigator.clipboard.writeText(previewDoc.innerText)
            .then(() => showToast('Preview content clipboard par copy ho gaya!', 'success'))
            .catch(() => showToast('Copy karne mein asafal.', 'error'));
        }
      });
    }

    // Zoom buttons
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => applyZoom(1));

    // Share Modal listeners
    if (btnOpenImport) btnOpenImport.addEventListener('click', openImportModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeImportModal);
    if (btnCancelImport) btnCancelImport.addEventListener('click', closeImportModal);
    if (btnSubmitImport) btnSubmitImport.addEventListener('click', handleModalSubmit);
    if (modalTabLink) modalTabLink.addEventListener('click', () => switchModalTab('link'));
    if (modalTabText) modalTabText.addEventListener('click', () => switchModalTab('text'));

    if (importModal) {
      importModal.addEventListener('click', (e) => {
        if (e.target === importModal) closeImportModal();
      });
    }

    // Setup mobile tab switching
    setupMobileTabs();

    // Initialize Auto Scaler
    if (window.SaafScaler) {
      window.SaafScaler.initAutoScaler();
    }

    // Initial render
    updatePreview();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
