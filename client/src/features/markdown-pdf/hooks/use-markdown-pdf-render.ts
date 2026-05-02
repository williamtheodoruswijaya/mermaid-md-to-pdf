"use client";

import { useCallback, useState } from "react";
import {
  inspectMarkdownPdf,
  previewMarkdownPdf,
  renderMarkdownPdf,
} from "../api/markdown-pdf.client";
import type {
  InspectResponse,
  MarkdownPdfPayload,
  PreviewResponse,
} from "../types/markdown-pdf.types";

export interface MarkdownPdfRenderState {
  readonly preview: PreviewResponse | null;
  readonly inspection: InspectResponse | null;
  readonly error: string | null;
  readonly isPreviewing: boolean;
  readonly isInspecting: boolean;
  readonly isRendering: boolean;
}

export function useMarkdownPdfRender(): MarkdownPdfRenderState & {
  readonly previewMarkdown: (payload: MarkdownPdfPayload) => Promise<void>;
  readonly inspectMarkdown: (payload: MarkdownPdfPayload) => Promise<void>;
  readonly downloadPdf: (payload: MarkdownPdfPayload) => Promise<void>;
} {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [inspection, setInspection] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const previewMarkdown = useCallback(async (payload: MarkdownPdfPayload) => {
    setError(null);
    setIsPreviewing(true);
    try {
      setPreview(await previewMarkdownPdf(payload));
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setIsPreviewing(false);
    }
  }, []);

  const inspectMarkdown = useCallback(async (payload: MarkdownPdfPayload) => {
    setError(null);
    setIsInspecting(true);
    try {
      setInspection(await inspectMarkdownPdf(payload));
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setIsInspecting(false);
    }
  }, []);

  const downloadPdf = useCallback(async (payload: MarkdownPdfPayload) => {
    setError(null);
    setIsRendering(true);
    try {
      const result = await renderMarkdownPdf(payload);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setIsRendering(false);
    }
  }, []);

  return {
    preview,
    inspection,
    error,
    isPreviewing,
    isInspecting,
    isRendering,
    previewMarkdown,
    inspectMarkdown,
    downloadPdf,
  };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed.";
}
