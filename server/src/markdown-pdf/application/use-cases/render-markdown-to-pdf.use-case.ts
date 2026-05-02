import { PdfResult } from '../../domain/entities/pdf-result.entity';
import type { RenderMarkdownInputDto } from '../dto/render-markdown-input.dto';
import { ApplicationError } from '../errors/application-error';
import type { PdfRendererPort } from '../ports/pdf-renderer.port';
import type { RenderLimits } from '../ports/render-limits.port';
import type { MarkdownRenderingPipeline } from './markdown-rendering-pipeline';

export class RenderMarkdownToPdfUseCase {
  constructor(
    private readonly pipeline: MarkdownRenderingPipeline,
    private readonly pdfRenderer: PdfRendererPort,
    private readonly limits: RenderLimits,
  ) {}

  async execute(input: RenderMarkdownInputDto): Promise<PdfResult> {
    const prepared = await this.pipeline.prepare(input);
    const bytes = await this.pdfRenderer.render(
      prepared.html,
      prepared.options,
    );

    if (bytes.byteLength > this.limits.maxPdfBytes) {
      throw new ApplicationError(
        'PDF_TOO_LARGE',
        'Generated PDF exceeds the configured output size limit.',
        {
          pdfBytes: bytes.byteLength,
          maxPdfBytes: this.limits.maxPdfBytes,
        },
        413,
      );
    }

    return new PdfResult(prepared.options.filename, bytes, 'application/pdf', {
      markdownBytes: prepared.metadata.markdownBytes,
      pdfBytes: bytes.byteLength,
      headingCount: prepared.metadata.headingCount,
      diagramCount: prepared.metadata.diagramCount,
      imageCount: prepared.metadata.imageCount,
      tableCount: prepared.metadata.tableCount,
    });
  }
}
