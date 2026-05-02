import type { PreviewMarkdownOutputDto } from '../dto/preview-markdown-output.dto';
import type { RenderMarkdownInputDto } from '../dto/render-markdown-input.dto';
import type { MarkdownRenderingPipeline } from './markdown-rendering-pipeline';

export class PreviewMarkdownHtmlUseCase {
  constructor(private readonly pipeline: MarkdownRenderingPipeline) {}

  async execute(
    input: RenderMarkdownInputDto,
  ): Promise<PreviewMarkdownOutputDto> {
    const prepared = await this.pipeline.prepare(input);

    return {
      html: prepared.html,
      metadata: prepared.metadata,
    };
  }
}
