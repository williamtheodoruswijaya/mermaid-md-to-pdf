"use client";

import { Download, Loader2 } from "lucide-react";

interface PdfDownloadButtonProps {
  readonly isRendering: boolean;
  readonly onClick: () => void;
}

export function PdfDownloadButton({
  isRendering,
  onClick,
}: PdfDownloadButtonProps) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={isRendering}
      onClick={onClick}
    >
      {isRendering ? (
        <Loader2 aria-hidden="true" className="animate-spin" size={17} />
      ) : (
        <Download aria-hidden="true" size={17} />
      )}
      PDF
    </button>
  );
}
