export interface MarkdownInspectionDto {
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
