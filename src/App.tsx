import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import html2pdf from "html2pdf.js";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github.css";
import "./App.css";

// Configure marked with highlight.js
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({
  breaks: true,
  gfm: true,
});

const defaultMarkdown = `# Markdown to PDF

### Hello from MD2PDF!

To convert your Markdown to PDF simply start by typing in the editor or pasting from your clipboard.

If your Markdown is in a file clear this content and drop your file into this editor.

<sup style="display: inline-block;">**tip:** click on the pencil icon on the left to clear the editor)</sup>

## GitHub flavoured styling by default

We now use GitHub flavoured styling by default.

## Features

- **Real-time preview**: See your PDF as you type
- **Code highlighting**: Syntax highlighting for code blocks
- **GitHub styling**: Beautiful GitHub-flavored markdown
- **Download PDF**: Export your document as PDF

## Code Example

\`\`\`javascript
function convertToPDF() {
  console.log("Converting markdown to PDF!");
  return "success";
}
\`\`\`

## Math Support (inline HTML)

You can use inline HTML for special formatting:

<div style="text-align: center; padding: 20px; background: #f6f8fa; border-radius: 6px;">
  <strong>E = mc²</strong>
</div>

## Lists

### Unordered List
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Table Example

| Feature | Status |
|---------|--------|
| Markdown parsing | ✅ |
| PDF export | ✅ |
| Syntax highlighting | ✅ |
| Real-time preview | ✅ |

## Blockquote

> "The best way to predict the future is to invent it."
> - Alan Kay

---

**Ready to export?** Click the "Download PDF" button!
`;

const STORAGE_KEY = "md2pdf-content";
const LAST_SAVED_KEY = "md2pdf-last-saved";

function App() {
  const [markdown, setMarkdown] = useState(() => {
    // Load from localStorage on initial mount
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || defaultMarkdown;
  });
  const [html, setHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Convert markdown to HTML
  useEffect(() => {
    const convertMarkdown = async () => {
      const htmlContent = await marked(markdown);
      setHtml(htmlContent);
    };
    convertMarkdown();
  }, [markdown]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, markdown);
      const now = new Date().toLocaleTimeString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      setLastSaved(now);
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [markdown]);

  // Load last saved time on mount
  useEffect(() => {
    const saved = localStorage.getItem(LAST_SAVED_KEY);
    if (saved) {
      setLastSaved(saved);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    try {
      // Clone the preview element to avoid modifying the original
      const element = previewRef.current;

      // Get the actual rendered width of the preview element
      const previewWidth = element.offsetWidth;

      // Configure html2pdf with optimal settings for high-quality rendering
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number], // [top, left, bottom, right] in mm
        filename: "markdown-to-pdf.pdf",
        image: { type: "jpeg" as const, quality: 0.98 }, // High-quality JPEG for better file size/quality balance
        html2canvas: {
          scale: 2, // Higher scale for better text rendering and sharper output
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          letterRendering: true,
          allowTaint: false,
          removeContainer: true,
          windowWidth: element.scrollWidth, // Use actual content width
          windowHeight: element.scrollHeight, // Use actual content height
          scrollX: 0,
          scrollY: 0,
          // Additional options for better text rendering
          dpi: 300, // Higher DPI for better quality
          foreignObjectRendering: false, // Better text rendering
        },
        jsPDF: {
          unit: "px" as const,
          format: [previewWidth + 96, 1400] as [number, number],
          orientation: "portrait" as const,
          compress: true, // Enable compression for better file size
          precision: 2, // Higher precision for better quality
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: ".page-break-before",
          after: ".page-break-after",
          avoid: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "pre",
            "code",
            "blockquote",
            "table",
            "tr",
            "td",
            "th",
            "img",
            "ul",
            "ol",
            "li",
            ".hljs",
          ],
        },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setMarkdown("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_SAVED_KEY);
    setLastSaved("");
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="app">
      {isGenerating && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Generating PDF...</p>
            <small>This may take a moment for large documents</small>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={cancelClear}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <div className="modal-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path
                    fillRule="evenodd"
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                  />
                </svg>
              </div>
            </div>
            <h2>Clear Editor?</h2>
            <p>
              Are you sure you want to clear all content? This will delete your
              current document and remove the auto-saved version.
            </p>
            <div className="modal-warning">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
              </svg>
              This action cannot be undone
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={cancelClear}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmClear}>
                Clear All Content
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img
              src="/logo.png"
              alt="MD to PDF Logo"
              className="logo-icon-img"
            />
            <span className="logo-text">Markdown to PDF</span>
            <a
              href="https://ko-fi.com/M4M21F2IMQ"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "20px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                height="36"
                style={{ border: 0, height: "36px" }}
                src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
                alt="Buy Me a Coffee at ko-fi.com"
              />
            </a>
            <a
              href="https://github.com/mirkobertone/md2pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "12px",
                display: "flex",
                alignItems: "center",
              }}
              title="View on GitHub"
            >
              <svg
                height="32"
                width="32"
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ color: "#ffffff" }}
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-clear"
              onClick={handleClear}
              title="Clear editor"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                <path
                  fillRule="evenodd"
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                />
              </svg>
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
              </svg>
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Markdown Editor</h3>
            {lastSaved && (
              <span className="auto-save-indicator">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
                Auto-saved at {lastSaved}
              </span>
            )}
          </div>
          <textarea
            className="editor"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
            spellCheck={false}
          />
        </div>

        <div className="divider"></div>

        <div className="preview-panel">
          <div className="panel-header">
            <h3>PDF Preview</h3>
          </div>
          <div className="preview-wrapper">
            <div
              ref={previewRef}
              className="preview markdown-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
