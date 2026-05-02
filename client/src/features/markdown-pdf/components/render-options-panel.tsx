"use client";

import { Settings2 } from "lucide-react";
import type {
  PageSize,
  RenderOptions,
  RenderTheme,
} from "../types/markdown-pdf.types";

interface RenderOptionsPanelProps {
  readonly options: RenderOptions;
  readonly onChange: (options: RenderOptions) => void;
}

export function RenderOptionsPanel({
  options,
  onChange,
}: RenderOptionsPanelProps) {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4 text-sm font-semibold">
        <Settings2 aria-hidden="true" size={18} />
        Options
      </div>
      <div className="grid gap-3 p-4">
        <label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
          Page
          <select
            className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
            value={options.pageSize}
            onChange={(event) =>
              onChange({
                ...options,
                pageSize: event.target.value as PageSize,
              })
            }
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
          Theme
          <select
            className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
            value={options.theme}
            onChange={(event) =>
              onChange({
                ...options,
                theme: event.target.value as RenderTheme,
              })
            }
          >
            <option value="github-light">Light</option>
            <option value="github-dark">Dark</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
          Margin
          <input
            className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
            value={options.margin}
            onChange={(event) =>
              onChange({ ...options, margin: event.target.value })
            }
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
          Filename
          <input
            className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
            value={options.filename}
            onChange={(event) =>
              onChange({ ...options, filename: event.target.value })
            }
          />
        </label>

        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-[var(--border)] px-3 text-sm">
          Mermaid
          <input
            type="checkbox"
            checked={options.renderMermaid}
            onChange={(event) =>
              onChange({ ...options, renderMermaid: event.target.checked })
            }
          />
        </label>

        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-[var(--border)] px-3 text-sm">
          Remote images
          <input
            type="checkbox"
            checked={options.allowRemoteImages}
            onChange={(event) =>
              onChange({ ...options, allowRemoteImages: event.target.checked })
            }
          />
        </label>
      </div>
    </section>
  );
}
