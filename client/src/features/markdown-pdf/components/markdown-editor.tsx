"use client";

import { FileText } from "lucide-react";

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <section className="flex min-h-[520px] flex-col border-r border-[var(--border)] bg-[var(--panel)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText aria-hidden="true" size={18} />
          Editor
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">
          {new Blob([value]).size.toLocaleString()} bytes
        </span>
      </div>
      <textarea
        className="min-h-[466px] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-6 text-[var(--foreground)] outline-none"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Markdown"
      />
    </section>
  );
}
