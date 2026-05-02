export type PageSize = "A4" | "Letter";
export type RenderTheme = "github-light" | "github-dark";

export interface RenderOptions {
  readonly pageSize: PageSize;
  readonly margin: string;
  readonly theme: RenderTheme;
  readonly renderMermaid: boolean;
  readonly allowRemoteImages: boolean;
  readonly timeoutMs: number;
  readonly filename: string;
}

export interface DocumentAssetPayload {
  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  readonly dataBase64: string;
  readonly sizeBytes: number;
}

export interface MarkdownPdfPayload {
  readonly markdown: string;
  readonly options: RenderOptions;
  readonly assets: readonly DocumentAssetPayload[];
}

export interface MarkdownInspection {
  readonly markdownBytes: number;
  readonly headingCount: number;
  readonly diagramCount: number;
  readonly imageCount: number;
  readonly tableCount: number;
  readonly codeBlockCount: number;
  readonly attachmentImageCount: number;
  readonly remoteImageCount: number;
  readonly dataImageCount: number;
}

export interface PreviewResponse {
  readonly html: string;
  readonly metadata: MarkdownInspection;
}

export interface InspectResponse {
  readonly metadata: MarkdownInspection;
}

export interface PdfDownload {
  readonly blob: Blob;
  readonly filename: string;
}

export interface ApiErrorResponse {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
