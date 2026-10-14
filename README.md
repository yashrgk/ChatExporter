# SaafPDF - Table poori. Formula saaf.

> **AI Chatbot Response to Clean, Readable & Shareable PDF Generator**
> Built for ChatGPT, Gemini, Claude & DeepSeek outputs.

---

## 🌟 Mukhya Khasiyat (Key Features)

1. **Table Poori Dikhana (Responsive Semantic Tables)**:
   - Markdown pipes (`|---|---|`) aur TSV (Tab-Separated Values) dono ko asli HTML/PDF tables mein badalta hai.
   - 5+ columns wali wide tables aur mobile viewports par cell padding aur typography automatically adapt hoti hai taaki koi column ya right side cell clip na ho.
   - Long text cells wrap hoti hain, koi content chhupta ya katta nahi hai.
   - Multi-page PDF mein table header (`thead`) har page par repeat hota hai aur rows beech mein nahi kat-ti (`break-inside: avoid`).

2. **Math Formulas Ka Auto-Scaling**:
   - Inline math (`$...$` aur `\(...\)`) aur display math (`$$...$$` aur `\[...\]`) KaTeX se typeset hote hain.
   - **Formula Auto-Scaler**: Agar equation page width se lambi ho to uska font scale down hota hai bina truncation ya artificial line breaks ke.
   - Do formulas alag lines par render hote hain, aapas mein merge nahi hote.

3. **Heading '#’ LaTeX Error Fix**:
   - `##### Step 3(a): Differentiate $p(x) = e^{3x}$` jaise headings ko proper `<h5>` heading ke roop mein parse karta hai.
   - Heading ke `#` character ko LaTeX mein nahi bheja jata, jisse `"macro parameter character #"` jaisi error kabhi nahi aati.

4. **Puri Chat Import (ChatGPT, Gemini & Claude Share Links)**:
   - Public shared links (`https://chatgpt.com/share/...`, `https://gemini.google.com/share/...` / `https://g.co/gemini/share/...`, ya `https://claude.ai/share/...`) se seedha conversation import karein.
   - **Direct Raw Chat Formatter**: Agar link private ho ya Cloudflare challenge aaye, to copied text (`Human:`/`Assistant:`, `User:`/`Gemini:`, `You said:`/`ChatGPT said:`) ko 1-click mein clean PDF Markdown mein convert karein.
   - **SSRF Protected First-Party Backend**: Keval approved hostnames aur `/share/` paths fetch karta hai. Header overflow safe (256KB buffer) aur local-only.

5. **2 Export Options**:
   - **PDF Banayein (Print Dialog)**: Browser ke native print engine se crisp vector quality aur native A4 margins ke saath PDF save karein.
   - **Download PDF**: Direct 1-click file download option (via `html2pdf.js`).
   - Print stylesheet mein sabhi UI buttons, editor aur headers chhupe rehte hain — sirf document print hota hai.

6. **Privacy Guaranteed**:
   - Pasted response 100% aapke browser mein locally process hota hai. Koi bhi private text kisi remote AI server par upload nahi hota.

---

## 🚀 Kaise Chalayein (Quick Start)

### 1. Server Start Karein:
```bash
npm start
```
Server loopback interface par shuru ho jayega:
👉 **http://127.0.0.1:3000**

### 2. Tests Run Karein:
Sabhi 15 Acceptance Criteria tests check karne ke liye:
```bash
npm test
```

---

## 🛠 Project Structure

```
├── package.json          # Node dependencies & npm scripts
├── server.js             # Local loopback server with SSRF-safe Share Link API
├── public/
│   ├── index.html        # Modern animated UI & A4 document sheet
│   ├── style.css         # Animated stylesheet, glassmorphism & @media print rules
│   ├── app.js            # Frontend logic, debounced preview, zoom & PDF export
│   ├── parser.js         # Markdown, TSV, KaTeX & Heading-safe parser
│   └── scaler.js         # Dynamic LaTeX formula & Table auto-scaler
└── tests/
    └── verify-all.js     # 15/15 Acceptance criteria automated tests
```
