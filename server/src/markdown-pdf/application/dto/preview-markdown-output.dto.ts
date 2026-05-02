import type { MarkdownInspectionDto } from './markdown-inspection.dto';

export interface PreviewMarkdownOutputDto {
  readonly html: string;
  readonly metadata: MarkdownInspectionDto;
}
