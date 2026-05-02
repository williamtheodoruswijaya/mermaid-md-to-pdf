export interface PdfResultMetadata {
  readonly markdownBytes: number;
  readonly pdfBytes: number;
  readonly headingCount: number;
  readonly diagramCount: number;
  readonly imageCount: number;
  readonly tableCount: number;
}

export class PdfResult {
  constructor(
    readonly filename: string,
    readonly bytes: Uint8Array,
    readonly contentType: 'application/pdf',
    readonly metadata: PdfResultMetadata,
  ) {}
}
