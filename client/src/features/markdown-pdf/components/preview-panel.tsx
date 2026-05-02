"use client";

import { Code2, ScanSearch } from "lucide-react";
import { useState } from "react";
import type {
  InspectResponse,
  PreviewResponse,
} from "../types/markdown-pdf.types";

interface PreviewPanelProps {
  readonly preview: PreviewResponse | null;
  readonly inspection: InspectResponse | null;
}

type PreviewMode = "preview" | "inspect";

export function PreviewPanel({ preview, inspection }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>("preview");

  return (
    <section className="flex min-h-[520px] flex-col bg-[var(--panel)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ScanSearch aria-hidden="true" size={18} />
          Output
        </div>
        <div className="inline-grid grid-cols-2 rounded-md border border-[var(--border)] bg-[var(--panel-muted)] p-1 text-xs font-medium">
          <button
            className={`rounded px-3 py-1.5 ${mode === "preview" ? "bg-white shadow-sm" : ""}`}
            type="button"
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
          <button
            className={`rounded px-3 py-1.5 ${mode === "inspect" ? "bg-white shadow-sm" : ""}`}
            type="button"
            onClick={() => setMode("inspect")}
          >
            Inspect
          </button>
        </div>
      </div>

      {mode === "preview" ? (
        <div className="min-h-[466px] flex-1 bg-white">
          {preview ? (
            <iframe
              className="h-full min-h-[466px] w-full"
              sandbox=""
              srcDoc={preview.html}
              title="Markdown PDF preview"
            />
          ) : (
            <EmptyState label="No preview" />
          )}
        </div>
      ) : (
        <div className="grid content-start gap-3 p-4">
          {inspection ? (
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(inspection.metadata).map(([key, value]) => (
                <div
                  className="rounded-md border border-[var(--border)] p-3"
                  key={key}
                >
                  <dt className="text-xs text-[var(--muted)]">
                    {formatMetricName(key)}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold">
                    {value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <EmptyState label="No inspection" />
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState({ label }: { readonly label: string }) {
  return (
    <div className="grid min-h-[466px] place-items-center text-sm text-[var(--muted)]">
      <div className="inline-flex items-center gap-2">
        <Code2 aria-hidden="true" size={17} />
        {label}
      </div>
    </div>
  );
}

function formatMetricName(key: string): string {
  return key
    .replace(/Count$/, "")
    .replace(/Bytes$/, " bytes")
    .replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
    .trim();
}
