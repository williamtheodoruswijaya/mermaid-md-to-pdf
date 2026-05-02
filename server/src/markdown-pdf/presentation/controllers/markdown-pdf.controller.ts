import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { PreviewMarkdownOutputDto } from '../../application/dto/preview-markdown-output.dto';
import { InspectMarkdownDocumentUseCase } from '../../application/use-cases/inspect-markdown-document.use-case';
import { PreviewMarkdownHtmlUseCase } from '../../application/use-cases/preview-markdown-html.use-case';
import { RenderMarkdownToPdfUseCase } from '../../application/use-cases/render-markdown-to-pdf.use-case';
import { RenderMarkdownRequestDto } from '../dto/render-markdown.request.dto';

@Controller('markdown-pdf')
export class MarkdownPdfController {
  constructor(
    private readonly renderMarkdownToPdf: RenderMarkdownToPdfUseCase,
    private readonly previewMarkdownHtml: PreviewMarkdownHtmlUseCase,
    private readonly inspectMarkdownDocument: InspectMarkdownDocumentUseCase,
  ) {}

  @Get('health')
  health(): { readonly status: 'ok' } {
    return { status: 'ok' };
  }

  @Post('render')
  async render(
    @Body() request: RenderMarkdownRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.renderMarkdownToPdf.execute(request);

    response.setHeader('Content-Type', result.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    response.setHeader('X-PDF-Bytes', String(result.metadata.pdfBytes));
    response.status(200).send(Buffer.from(result.bytes));
  }

  @Post('preview')
  async preview(
    @Body() request: RenderMarkdownRequestDto,
  ): Promise<PreviewMarkdownOutputDto> {
    return this.previewMarkdownHtml.execute(request);
  }

  @Post('inspect')
  inspect(@Body() request: RenderMarkdownRequestDto): {
    readonly metadata: ReturnType<InspectMarkdownDocumentUseCase['execute']>;
  } {
    return {
      metadata: this.inspectMarkdownDocument.execute(request.markdown),
    };
  }
}
