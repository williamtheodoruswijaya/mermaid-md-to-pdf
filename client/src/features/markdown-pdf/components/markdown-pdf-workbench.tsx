"use client";

import { AlertCircle, Eye, ScanLine, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useMarkdownPdfRender } from "../hooks/use-markdown-pdf-render";
import type {
  DocumentAssetPayload,
  MarkdownPdfPayload,
  RenderOptions,
} from "../types/markdown-pdf.types";
import { AssetUploader } from "./asset-uploader";
import { MarkdownEditor } from "./markdown-editor";
import { PdfDownloadButton } from "./pdf-download-button";
import { PreviewPanel } from "./preview-panel";
import { RenderOptionsPanel } from "./render-options-panel";

const sampleMarkdown = `# Markdown PDF Test

This document includes tables, code, a Mermaid diagram, and uploaded images.

| Feature | Status |
| ------- | ------ |
| Markdown | Ready |
| Tables | Ready |
| Mermaid | Ready |

\`\`\`ts
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

\`\`\`mermaid
graph TD
  A[Markdown] --> B[Sanitized HTML]
  B --> C[PDF]
\`\`\`
`;

const defaultOptions: RenderOptions = {
  pageSize: "A4",
  margin: "16mm",
  theme: "github-light",
  renderMermaid: true,
  allowRemoteImages: false,
  timeoutMs: 30000,
  filename: "markdown-document.pdf",
};

export function MarkdownPdfWorkbench() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [assets, setAssets] = useState<readonly DocumentAssetPayload[]>([]);
  const [options, setOptions] = useState<RenderOptions>(defaultOptions);
  const renderState = useMarkdownPdfRender();

  const payload = useMemo<MarkdownPdfPayload>(
    () => ({
      markdown,
      options,
      assets,
    }),
    [assets, markdown, options],
  );

  function insertReference(reference: string) {
    setMarkdown((current) => `${current.trimEnd()}\n\n${reference}\n`);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-3 text-[var(--foreground)] md:px-5 md:py-5">
      <div className="mx-auto grid max-w-[1520px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-sm xl:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">
        <MarkdownEditor value={markdown} onChange={setMarkdown} />

        <aside className="border-r border-[var(--border)] bg-[var(--panel)] xl:min-h-[calc(100vh-40px)]">
          <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck aria-hidden="true" size={18} />
              Markdown PDF
            </div>
            <span className="rounded bg-[var(--panel-muted)] px-2 py-1 font-mono text-xs text-[var(--muted)]">
              Vercel
            </span>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] p-4">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--panel-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={renderState.isPreviewing}
              onClick={() => void renderState.previewMarkdown(payload)}
            >
              <Eye aria-hidden="true" size={16} />
              Preview
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--panel-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={renderState.isInspecting}
              onClick={() => void renderState.inspectMarkdown(payload)}
            >
              <ScanLine aria-hidden="true" size={16} />
              Inspect
            </button>
            <PdfDownloadButton
              isRendering={renderState.isRendering}
              onClick={() => void renderState.downloadPdf(payload)}
            />
          </div>

          {renderState.error ? (
            <div className="flex items-start gap-2 border-b border-[var(--border)] bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
              <AlertCircle aria-hidden="true" className="mt-0.5" size={17} />
              <span>{renderState.error}</span>
            </div>
          ) : null}

          <RenderOptionsPanel options={options} onChange={setOptions} />
          <AssetUploader
            assets={assets}
            onAssetsChange={setAssets}
            onInsertReference={insertReference}
          />
        </aside>

        <PreviewPanel
          preview={renderState.preview}
          inspection={renderState.inspection}
        />
      </div>
    </main>
  );
}
