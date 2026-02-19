# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Vite dev server
pnpm build        # TypeScript check + Vite production build (tsc -b && vite build)
pnpm lint         # Run ESLint
pnpm preview      # Preview the production build locally
```

There are no tests.

## Architecture

Single-page React app (no backend) that converts Markdown to PDF in the browser.

**Core files:**
- `src/App.tsx` — The entire application in one component. Handles markdown state, real-time preview rendering, Mermaid diagram rendering, PDF export, and the split-panel UI.
- `src/App.css` — All custom styles. The preview panel also uses `github-markdown-css` for GFM-style rendering.
- `src/main.tsx` — Entry point; mounts App in StrictMode.

**Key data flow:**
1. User types in the left editor panel → state updates → `marked` converts markdown to HTML → rendered in the right preview panel via `dangerouslySetInnerHTML`
2. Mermaid diagram blocks are intercepted during rendering and processed separately (async) via `mermaid.render()`
3. On PDF export, `html2pdf.js` captures the preview panel DOM to produce the PDF

**Persistence:** Editor content is auto-saved to `localStorage`.

**Tech stack:** React 19, TypeScript (strict), Vite, marked + marked-highlight, highlight.js, mermaid, html2pdf.js / jsPDF / html2canvas, github-markdown-css.

**Package manager:** pnpm (see `pnpm-lock.yaml`).
