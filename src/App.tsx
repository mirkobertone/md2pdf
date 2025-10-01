import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github.css";
import "./App.css";

// Configure marked with highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error(err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

const defaultMarkdown = `# Markdown to PDF

### We've converted 1,924,501 Markdown files to PDF and counting!

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

function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [html, setHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const convertMarkdown = async () => {
      const htmlContent = await marked(markdown);
      setHtml(htmlContent);
    };
    convertMarkdown();
  }, [markdown]);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Handle multiple pages
      let heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          position,
          imgWidth * ratio,
          imgHeight * ratio
        );
        heightLeft -= pdfHeight;
      }

      pdf.save("markdown-to-pdf.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setMarkdown("");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">M</div>
            <span className="logo-text">Markdown to PDF</span>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              title="Clear editor"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z" />
                <path d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z" />
              </svg>
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
