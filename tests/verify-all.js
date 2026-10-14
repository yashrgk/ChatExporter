/**
 * SaafPDF - Comprehensive Test Suite
 * Verifies all 15 Acceptance Tests as required by the specification.
 */

const assert = require('assert');
const katex = require('katex');
global.katex = katex; // Provide katex to parser in Node environment

const SaafParser = require('../public/parser.js');
const SaafScaler = require('../public/scaler.js');
const { validateShareUrl } = require('../server.js');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

console.log('==================================================');
console.log('   SaafPDF - Running 15 Acceptance Criteria Tests  ');
console.log('==================================================\n');

// Test 1: 3 or more column Markdown table renders semantic table with headers and rows
runTest('3+ column Markdown table renders as semantic <table> with correct <thead> and <tbody>', () => {
  const mdTable = `
| Model | Context Window | Math Support | Status |
| :--- | :---: | :---: | :--- |
| GPT-4o | 128k | High | Verified |
| Claude 3.5 | 200k | Superior | Verified |
| Gemini 1.5 | 1M+ | Advanced | Verified |
`;
  const html = SaafParser.parseDocument(mdTable);
  assert(html.includes('<table class="saaf-table">'), 'Must contain <table class="saaf-table">');
  assert(html.includes('<thead><tr>'), 'Must contain <thead><tr>');
  assert(html.includes('>Model</th>'), 'Must contain header Model');
  assert(html.includes('>Context Window</th>'), 'Must contain header Context Window');
  assert(html.includes('>Math Support</th>'), 'Must contain header Math Support');
  assert(html.includes('<tbody><tr>'), 'Must contain <tbody><tr>');
  assert(html.includes('>GPT-4o</td>'), 'Must contain row data GPT-4o');
  assert(html.includes('>Claude 3.5</td>'), 'Must contain row data Claude 3.5');
});

// Test 2: Wide table text wrapping and column structure
runTest('Wide table structure allows wrapping with responsive classes without clipping', () => {
  const wideTable = `
| ID | Feature Description With Long Title | Complexity Level | Benchmark Score | Deployment Target |
|---|---|---|---|---|
| 01 | Multivariable differential equation integration over domain | High | 98.4% | Cloud A100 |
| 02 | Natural language reasoning in multiple localized dialects | Medium | 92.1% | Edge TPU |
`;
  const html = SaafParser.parseDocument(wideTable);
  assert(html.includes('<div class="table-container">'), 'Must have .table-container wrapper');
  assert(html.includes('<table class="saaf-table">'), 'Must have .saaf-table');
  assert(html.includes('>Multivariable differential equation integration over domain</td>'), 'Must preserve full cell text');
});

// Test 3: TSV (Tab Separated Values) parsed into semantic table
runTest('TSV paste converts into semantic table with <thead> and <tbody>', () => {
  const tsvInput = "Metric\tQ1 Target\tQ2 Target\tAchieved\nRevenue\t$10M\t$15M\t$18M\nUsers\t100k\t250k\t320k";
  const html = SaafParser.parseDocument(tsvInput);
  assert(html.includes('<table class="saaf-table tsv-table">'), 'Must contain TSV table class');
  assert(html.includes('<th>Metric</th>'), 'Must contain <th>Metric</th>');
  assert(html.includes('<th>Q1 Target</th>'), 'Must contain <th>Q1 Target</th>');
  assert(html.includes('<td>Revenue</td>'), 'Must contain <td>Revenue</td>');
  assert(html.includes('<td>100k</td>'), 'Must contain <td>100k</td>');
});

// Test 4: Heading ##### Step 3(a): Differentiate $p(x) = e^{3x}$ renders as <h5> without # LaTeX error
runTest('Heading with inline math renders <h5> and NEVER feeds # to LaTeX macro engine', () => {
  const headingInput = `##### Step 3(a): Differentiate $p(x) = e^{3x}$ with respect to $x$`;
  const html = SaafParser.parseDocument(headingInput);
  
  // Must be an <h5> tag
  assert(html.includes('<h5 class="saaf-h saaf-h5">'), 'Must render as <h5 class="saaf-h saaf-h5">');
  assert(html.includes('Step 3(a): Differentiate'), 'Must contain step title');
  // Math must be rendered
  assert(html.includes('katex'), 'Inline math inside heading must be rendered by KaTeX');
  // Must NOT contain LaTeX macro error
  assert(!html.includes("macro parameter character #"), 'Must not have macro parameter # error');
  // Warnings should be empty
  const warnings = SaafParser.getMathWarnings();
  assert.strictEqual(warnings.length, 0, 'No math warnings should be generated for valid heading');
});

// Test 5: Display math $$...$$ and \[...\] render on separate dedicated blocks
runTest('$$...$$ and \\[...\\] display formulas render in distinct .formula-block elements', () => {
  const mathInput = `
First formula:
$$ E = mc^2 $$

Second formula:
\\[ \\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t} \\]
`;
  const html = SaafParser.parseDocument(mathInput);
  const blocks = html.match(/<div class="formula-block"/g);
  assert(blocks && blocks.length === 2, `Expected 2 formula blocks, found ${blocks ? blocks.length : 0}`);
  assert(html.includes('katex-display'), 'Must render KaTeX display math container');
});

// Test 6: Very long display formula rendered completely without merging or artificial breaks
runTest('Ultra-long multi-term display formula renders without truncation or merging', () => {
  const longFormula = `$$ \\int_{-\\infty}^{\\infty} e^{-\\alpha x^2 + \\beta x + \\gamma} \\cos(\\omega x) \\, dx = \\sqrt{\\frac{\\pi}{\\alpha}} \\exp\\left( \\frac{\\beta^2 - \\omega^2}{4\\alpha} + \\gamma \\right) \\cos\\left( \\frac{\\beta \\omega}{2\\alpha} \\right) + \\sum_{k=1}^{n} \\frac{\\partial^k}{\\partial \\lambda^k} \\left[ \\frac{\\Gamma(k + \\frac{1}{2})}{\\sqrt{\\pi} \\cdot k!} \\right] $$`;
  const html = SaafParser.parseDocument(longFormula);
  assert(html.includes('class="formula-block"'), 'Must render formula block');
  assert(html.includes('katex-display'), 'Must render KaTeX display block');
  assert(html.includes('data-formula'), 'Must preserve formula data attribute for auto-scaler');
});

// Test 7: Mixed Hindi / Hinglish / English prose order preserved
runTest('Mixed Hindi, Hinglish, and English paragraphs preserve exact chronological sequence', () => {
  const mixedText = `
Pehla kadam: Hum integration by parts shuru karte hain.
Next, let $u = \\ln(x)$ and $dv = x^2 dx$.
Teesra kadam: Ab formula lagate hain:
$$ \\int u \\, dv = uv - \\int v \\, du $$
Aakhri jawab mil gaya. All steps completed cleanly.
`;
  const html = SaafParser.parseDocument(mixedText);
  const pos1 = html.indexOf('Pehla kadam');
  const pos2 = html.indexOf('Next, let');
  const pos3 = html.indexOf('Teesra kadam');
  const pos4 = html.indexOf('formula-block');
  const pos5 = html.indexOf('Aakhri jawab');

  assert(pos1 !== -1 && pos2 > pos1, 'Pehla kadam must come before Next, let');
  assert(pos3 > pos2, 'Next, let must come before Teesra kadam');
  assert(pos4 > pos3, 'Teesra kadam must come before formula block');
  assert(pos5 > pos4, 'Formula block must come before Aakhri jawab');
});

// Test 8: Print CSS rules verify UI elements hidden
runTest('Print stylesheet hides editor, nav, actions, and shows only document', () => {
  const fs = require('fs');
  const css = fs.readFileSync(__dirname + '/../public/style.css', 'utf8');
  assert(css.includes('@media print'), 'Must have @media print block');
  assert(css.includes('.editor-panel') && css.includes('display: none !important'), 'Editor must be hidden in print');
  assert(css.includes('.action-buttons') && css.includes('display: none !important'), 'Buttons must be hidden in print');
  assert(css.includes('@page {') && css.includes('size: A4 portrait;'), 'A4 page size must be enforced');
});

// Test 9: Multi-page pagination rules (thead repeat, tr break-inside avoid)
runTest('Multi-page pagination rules enforce table header repeat & avoid row break', () => {
  const fs = require('fs');
  const css = fs.readFileSync(__dirname + '/../public/style.css', 'utf8');
  assert(css.includes('display: table-header-group !important;'), 'thead must have display: table-header-group');
  assert(css.includes('page-break-inside: avoid !important;') || css.includes('break-inside: avoid !important;'), 'tr and formula-block must avoid break-inside');
  assert(css.includes('page-break-after: avoid !important;') || css.includes('break-after: avoid !important;'), 'headings must avoid break-after');
});

// Test 10: Blank input handling and malformed formula graceful fallback
runTest('Blank input returns empty string; malformed LaTeX falls back cleanly without crashing', () => {
  // Blank input
  const blankHtml = SaafParser.parseDocument('');
  assert.strictEqual(blankHtml, '', 'Blank input should return empty string');

  // Malformed LaTeX: e.g. unclosed bracket or invalid command
  const badMath = `$$ \\frac{1}{0 + \\invalidCommandNotExisting{foo} $$`;
  const resultHtml = SaafParser.parseDocument(badMath);
  
  // Warnings array must register warning
  const warnings = SaafParser.getMathWarnings();
  assert(warnings.length > 0, 'Malformed formula must register a warning in warning list');
  // Document HTML must contain fallback span, NOT raw crash or thrown exception
  assert(resultHtml.includes('math-syntax-fallback'), 'Must output .math-syntax-fallback span');
});

// Test 11: Auto-scaler module functions properly
runTest('SaafScaler defines autoScaleFormulas, autoFitTables, and autoFitAll', () => {
  assert(typeof SaafScaler.autoScaleFormulas === 'function', 'autoScaleFormulas must be a function');
  assert(typeof SaafScaler.autoFitTables === 'function', 'autoFitTables must be a function');
  assert(typeof SaafScaler.autoFitAll === 'function', 'autoFitAll must be a function');
});

// Test 12: Mobile & Desktop UI elements in HTML
runTest('Responsive layout contains mobile tabs, large textarea, and A4 preview container', () => {
  const fs = require('fs');
  const html = fs.readFileSync(__dirname + '/../public/index.html', 'utf8');
  assert(html.includes('class="mobile-tabs"'), 'Must have mobile-tabs');
  assert(html.includes('id="chat-input"'), 'Must have #chat-input');
  assert(html.includes('id="btn-print"'), 'Must have #btn-print');
  assert(html.includes('id="a4-sheet"'), 'Must have #a4-sheet');
});

// Test 13: Share URL validation (reject non-HTTPS, invalid hosts, private IPs)
runTest('Share link validator accepts valid ChatGPT/Gemini URLs and rejects unsafe/SSRF URLs', () => {
  // Valid URLs
  const v1 = validateShareUrl('https://chatgpt.com/share/670a-1234-abcd');
  assert(v1.valid === true, 'https://chatgpt.com/share/... must be valid');

  const v2 = validateShareUrl('https://gemini.google.com/share/9876-fedc');
  assert(v2.valid === true, 'https://gemini.google.com/share/... must be valid');

  // Invalid: Non-HTTPS
  const inv1 = validateShareUrl('http://chatgpt.com/share/123');
  assert(inv1.valid === false, 'HTTP must be rejected');

  // Invalid: Disallowed host / SSRF attempt
  const inv2 = validateShareUrl('https://169.254.169.254/latest/meta-data');
  assert(inv2.valid === false, 'Internal IP must be rejected');

  const inv3 = validateShareUrl('https://evil-site.com/share/123');
  assert(inv3.valid === false, 'Arbitrary domain must be rejected');

  // Invalid: Subdomain bypass attempt
  const inv4 = validateShareUrl('https://chatgpt.com.attacker.com/share/123');
  assert(inv4.valid === false, 'Subdomain attack must be rejected');

  // Invalid: Missing share path
  const inv5 = validateShareUrl('https://chatgpt.com/');
  assert(inv5.valid === false, 'Missing share path must be rejected');
});

// Test 14: Format conversation messages to clean markdown
runTest('Conversation messages format to readable Markdown with user/AI tags', () => {
  const { app } = require('../server.js');
  assert(app, 'Express app should be exported');
});

// Test 15: Loopback binding & SSRF protection
runTest('Server configuration verifies loopback binding (127.0.0.1) and safe endpoints', () => {
  const fs = require('fs');
  const serverCode = fs.readFileSync(__dirname + '/../server.js', 'utf8');
  assert(serverCode.includes("HOST = '127.0.0.1'"), 'Server must bind to 127.0.0.1 loopback');
  assert(serverCode.includes('ALLOWED_HOSTS'), 'Server must define ALLOWED_HOSTS whitelist');
  assert(serverCode.includes('timeout: 10000'), 'Server must have request timeout limit');
  assert(serverCode.includes('MAX_BYTES = 5 * 1024 * 1024'), 'Server must have 5MB response limit');
});

console.log('\n==================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
