import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import mermaid from "mermaid";
import html2pdf from "html2pdf.js";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github.css";
import "./App.css";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
});

// Configure marked with highlight.js (skip mermaid blocks)
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang === "mermaid") return code;
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  {
    renderer: {
      code({ text, lang }) {
        if (lang === "mermaid") {
          return `<div class="mermaid">${text}</div>\n`;
        }
        return false as unknown as string;
      },
    },
  }
);

marked.setOptions({
  breaks: true,
  gfm: true,
});

let mermaidCounter = 0;

async function renderMermaidInHtml(html: string): Promise<string> {
  const mermaidRegex = /<div class="mermaid">([\s\S]*?)<\/div>/g;
  const matches = [...html.matchAll(mermaidRegex)];
  if (matches.length === 0) return html;

  let result = html;
  for (const match of matches) {
    const code = match[1].trim();
    try {
      const id = `mermaid-svg-${Date.now()}-${mermaidCounter++}`;
      const { svg } = await mermaid.render(id, code);
      result = result.replace(match[0], `<div class="mermaid">${svg}</div>`);
    } catch (e) {
      console.warn("Mermaid render error:", e);
    }
  }
  return result;
}

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
- **Mermaid diagrams**: Flowcharts, sequence diagrams, and more
- **GitHub styling**: Beautiful GitHub-flavored markdown
- **Download PDF**: Export your document as PDF

## Code Example

\`\`\`javascript
function convertToPDF() {
  console.log("Converting markdown to PDF!");
  return "success";
}
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
    A[Markdown] --> B[HTML]
    B --> C{Preview}
    C --> D[PDF]
    C --> E[Screen]
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

// Data model
interface MdFile {
  id: string;
  name: string;
  content: string;
  lastSaved: string;
}

// Storage keys
const FILES_KEY = "md2pdf-files";
const ACTIVE_FILE_KEY = "md2pdf-active-file";
const SIDEBAR_KEY = "md2pdf-sidebar-open";
const LEGACY_CONTENT_KEY = "md2pdf-content";
const LEGACY_SAVED_KEY = "md2pdf-last-saved";

// Storage helpers
function createNewFile(name: string, content: string): MdFile {
  return {
    id: crypto.randomUUID(),
    name,
    content,
    lastSaved: "",
  };
}

function loadFilesFromStorage(): MdFile[] {
  const raw = localStorage.getItem(FILES_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as MdFile[];
    } catch {
      // fall through to migration
    }
  }
  // Migration: read legacy content
  const legacyContent = localStorage.getItem(LEGACY_CONTENT_KEY);
  const file = createNewFile("My Document", legacyContent ?? defaultMarkdown);
  localStorage.removeItem(LEGACY_CONTENT_KEY);
  localStorage.removeItem(LEGACY_SAVED_KEY);
  const files = [file];
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  return files;
}

function loadActiveFileId(): string {
  return localStorage.getItem(ACTIVE_FILE_KEY) ?? "";
}

function persistFiles(files: MdFile[]): void {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

function App() {
  const [files, setFiles] = useState<MdFile[]>(() => loadFilesFromStorage());
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const stored = loadActiveFileId();
    const loaded = loadFilesFromStorage();
    if (stored && loaded.find((f) => f.id === stored)) return stored;
    return loaded[0]?.id ?? "";
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [html, setHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === null ? true : stored === "true";
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  };

  // Derived
  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];
  const markdown = activeFile?.content ?? "";
  const lastSaved = activeFile?.lastSaved ?? "";

  // Convert markdown to HTML and pre-render mermaid diagrams to SVG
  useEffect(() => {
    const convertMarkdown = async () => {
      const htmlContent = await marked(markdown);
      const withMermaid = await renderMermaidInHtml(htmlContent);
      setHtml(withMermaid);
    };
    convertMarkdown();
  }, [markdown]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!activeFile) return;
    const timer = setTimeout(() => {
      const now = new Date().toLocaleTimeString();
      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === activeFile.id ? { ...f, lastSaved: now } : f
        );
        persistFiles(updated);
        return updated;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [markdown, activeFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // File handlers
  const createFile = () => {
    const existingUntitled = files.filter(
      (f) => f.name === "Untitled" || f.name.match(/^Untitled \d+$/)
    );
    let name = "Untitled";
    if (existingUntitled.length > 0) {
      name = `Untitled ${existingUntitled.length + 1}`;
    }
    const file = createNewFile(name, "");
    const updated = [...files, file];
    setFiles(updated);
    persistFiles(updated);
    setActiveFileId(file.id);
    localStorage.setItem(ACTIVE_FILE_KEY, file.id);
  };

  const selectFile = (id: string) => {
    if (renamingId) {
      commitRename(renamingId, renameValue);
    }
    setActiveFileId(id);
    localStorage.setItem(ACTIVE_FILE_KEY, id);
  };

  const updateContent = (content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile?.id ? { ...f, content } : f))
    );
  };

  const deleteFile = (id: string) => {
    if (files.length === 1) {
      // Clear content instead of deleting last file
      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === id ? { ...f, content: "", lastSaved: "" } : f
        );
        persistFiles(updated);
        return updated;
      });
      return;
    }
    const idx = files.findIndex((f) => f.id === id);
    const updated = files.filter((f) => f.id !== id);
    persistFiles(updated);
    setFiles(updated);
    if (activeFileId === id) {
      const sibling = updated[Math.max(0, idx - 1)];
      setActiveFileId(sibling.id);
      localStorage.setItem(ACTIVE_FILE_KEY, sibling.id);
    }
  };

  const cloneFile = (id: string) => {
    const source = files.find((f) => f.id === id);
    if (!source) return;
    const file = createNewFile(`${source.name} (copy)`, source.content);
    const idx = files.findIndex((f) => f.id === id);
    const updated = [...files.slice(0, idx + 1), file, ...files.slice(idx + 1)];
    setFiles(updated);
    persistFiles(updated);
    setActiveFileId(file.id);
    localStorage.setItem(ACTIVE_FILE_KEY, file.id);
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = (id: string, name: string) => {
    const trimmed = name.trim();
    const original = files.find((f) => f.id === id)?.name ?? "";
    const finalName = trimmed || original;
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, name: finalName } : f
      );
      persistFiles(updated);
      return updated;
    });
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    try {
      const element = previewRef.current;
      const previewWidth = element.offsetWidth;

      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: "markdown-to-pdf.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          letterRendering: true,
          allowTaint: false,
          removeContainer: true,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          dpi: 300,
          foreignObjectRendering: false,
        },
        jsPDF: {
          unit: "px" as const,
          format: [previewWidth + 96, 1400] as [number, number],
          orientation: "portrait" as const,
          compress: true,
          precision: 2,
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
            ".mermaid",
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
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === activeFile?.id ? { ...f, content: "", lastSaved: "" } : f
      );
      persistFiles(updated);
      return updated;
    });
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
              Are you sure you want to clear all content? This will clear the
              content of this file. The file will remain in your file list.
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

      {showExportDialog && (
        <div
          className="modal-overlay"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="modal-content export-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Export Document</h2>
            <p className="export-dialog-subtitle">
              Choose a format to download your document
            </p>
            <div className="format-cards">
              <button
                className="format-card"
                onClick={async () => {
                  setShowExportDialog(false);
                  await handleDownloadPDF();
                }}
                disabled={isGenerating}
              >
                <div className="format-card-icon format-card-icon--pdf">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 13h2v5H9zM9 17h2v2H9zM13 13h2v7h-2zM17 13h2v4h-2z" />
                  </svg>
                </div>
                <div className="format-card-body">
                  <span className="format-card-name">PDF</span>
                  <span className="format-card-desc">
                    Portable document, ideal for sharing and printing
                  </span>
                </div>
              </button>
              <button
                className="format-card format-card--disabled"
                onClick={() => {}}
                title="Coming soon"
              >
                <div className="format-card-icon format-card-icon--html">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="format-card-body">
                  <span className="format-card-name">HTML</span>
                  <span className="format-card-desc">
                    Web page with styling preserved
                  </span>
                </div>
                <span className="coming-soon-badge">Coming soon</span>
              </button>
              <button
                className="format-card format-card--disabled"
                onClick={() => {}}
                title="Coming soon"
              >
                <div className="format-card-icon format-card-icon--docx">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M8 13h2v7H8zM12 13h2v7h-2zM16 13h2v7h-2z" />
                  </svg>
                </div>
                <div className="format-card-body">
                  <span className="format-card-name">DOCX</span>
                  <span className="format-card-desc">
                    Microsoft Word document format
                  </span>
                </div>
                <span className="coming-soon-badge">Coming soon</span>
              </button>
              <button
                className="format-card format-card--disabled"
                onClick={() => {}}
                title="Coming soon"
              >
                <div className="format-card-icon format-card-icon--txt">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <div className="format-card-body">
                  <span className="format-card-name">Plain Text (.txt)</span>
                  <span className="format-card-desc">
                    Unformatted markdown source
                  </span>
                </div>
                <span className="coming-soon-badge">Coming soon</span>
              </button>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setShowExportDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <button
              className="btn-sidebar-toggle"
              onClick={toggleSidebar}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
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
              className="btn btn-primary"
              onClick={() => setShowExportDialog(true)}
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
              {isGenerating ? "Generating..." : "Download"}
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className={`sidebar${sidebarOpen ? "" : " sidebar--collapsed"}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">Files</span>
            <button
              className="btn-new-file"
              onClick={createFile}
              title="New file"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New</span>
            </button>
          </div>
          <ul className="file-list">
            {files.map((file) => (
              <li
                key={file.id}
                className={`file-item${file.id === activeFileId ? " file-item--active" : ""}`}
                onClick={() => selectFile(file.id)}
                title={file.lastSaved ? `Saved at ${file.lastSaved}` : file.name}
              >
                <svg
                  className="file-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className="file-name">
                  {file.name}
                </span>
                <button
                  className="file-action-btn file-clone-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        cloneFile(file.id);
                      }}
                      title="Clone file"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                    <button
                      className="file-action-btn file-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      title="Delete file"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="divider"></div>

        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              {renamingId === activeFile?.id ? (
                <input
                  className="panel-rename-input"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(activeFile.id, renameValue)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(activeFile.id, renameValue);
                    if (e.key === "Escape") cancelRename();
                  }}
                />
              ) : (
                <>
                  <h3
                    className="panel-filename"
                    onClick={() => activeFile && startRename(activeFile.id, activeFile.name)}
                    title="Click to rename"
                  >
                    {activeFile?.name ?? "Untitled"}
                  </h3>
                  <button
                    className="panel-rename-btn"
                    onClick={() => activeFile && startRename(activeFile.id, activeFile.name)}
                    title="Rename file"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className="panel-header-actions">
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
              <button
                className="btn-clear-editor"
                onClick={handleClear}
                title="Clear editor"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path
                    fillRule="evenodd"
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <textarea
            className="editor"
            value={markdown}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="Type your markdown here..."
            spellCheck={false}
          />
        </div>

        <div className="divider"></div>

        <div className="preview-panel">
          <div className="panel-header">
            <h3>Preview</h3>
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
