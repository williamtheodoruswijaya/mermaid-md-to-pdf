import type {
  ApiErrorResponse,
  InspectResponse,
  MarkdownPdfPayload,
  PdfDownload,
  PreviewResponse,
} from "../types/markdown-pdf.types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export async function previewMarkdownPdf(
  payload: MarkdownPdfPayload,
): Promise<PreviewResponse> {
  return postJson<PreviewResponse>("/markdown-pdf/preview", payload);
}

export async function inspectMarkdownPdf(
  payload: MarkdownPdfPayload,
): Promise<InspectResponse> {
  return postJson<InspectResponse>("/markdown-pdf/inspect", payload);
}

export async function renderMarkdownPdf(
  payload: MarkdownPdfPayload,
): Promise<PdfDownload> {
  const response = await fetch(`${apiBaseUrl}/markdown-pdf/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return {
    blob: await response.blob(),
    filename: readFilename(response.headers) ?? payload.options.filename,
  };
}

async function postJson<T>(
  pathname: string,
  payload: MarkdownPdfPayload,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json() as Promise<T>;
}

async function readApiError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return `Request failed with status ${response.status}.`;
  }

  const payload = (await response.json()) as Partial<ApiErrorResponse>;
  return payload.message ?? `Request failed with status ${response.status}.`;
}

function readFilename(headers: Headers): string | null {
  const disposition = headers.get("content-disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}
