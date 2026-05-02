import { Module } from '@nestjs/common';
import {
  DEFAULT_DOCUMENT_LIMITS,
  type DocumentLimits,
} from './domain/entities/markdown-document.entity';
import { DOCUMENT_STORAGE } from './application/ports/document-storage.port';
import {
  DIAGRAM_RENDERER,
  type DiagramRendererPort,
} from './application/ports/diagram-renderer.port';
import {
  HTML_SANITIZER,
  type HtmlSanitizerPort,
} from './application/ports/html-sanitizer.port';
import {
  IMAGE_RESOLVER,
  type ImageResolverPort,
} from './application/ports/image-resolver.port';
import {
  MARKDOWN_PARSER,
  type MarkdownParserPort,
} from './application/ports/markdown-parser.port';
import {
  PDF_RENDERER,
  type PdfRendererPort,
} from './application/ports/pdf-renderer.port';
import { RENDER_LIMITS } from './application/ports/render-limits.port';
import { InspectMarkdownDocumentUseCase } from './application/use-cases/inspect-markdown-document.use-case';
import { MarkdownRenderingPipeline } from './application/use-cases/markdown-rendering-pipeline';
import { PreviewMarkdownHtmlUseCase } from './application/use-cases/preview-markdown-html.use-case';
import { RenderMarkdownToPdfUseCase } from './application/use-cases/render-markdown-to-pdf.use-case';
import { ValidateMarkdownAssetsUseCase } from './application/use-cases/validate-markdown-assets.use-case';
import { MermaidSvgRendererAdapter } from './infrastructure/diagram/mermaid-svg-renderer.adapter';
import { SafeRemoteImageResolverAdapter } from './infrastructure/image/safe-remote-image-resolver.adapter';
import { SanitizeHtmlAdapter } from './infrastructure/markdown/html-sanitizer.adapter';
import { MarkdownHtmlRendererAdapter } from './infrastructure/markdown/markdown-html-renderer.adapter';
import { ChromiumPdfRendererAdapter } from './infrastructure/pdf/chromium-pdf-renderer.adapter';
import { MemoryDocumentStorageAdapter } from './infrastructure/storage/memory-document-storage.adapter';
import { MarkdownPdfController } from './presentation/controllers/markdown-pdf.controller';

@Module({
  controllers: [MarkdownPdfController],
  providers: [
    InspectMarkdownDocumentUseCase,
    {
      provide: RENDER_LIMITS,
      useFactory: (): DocumentLimits => buildDocumentLimits(),
    },
    {
      provide: MARKDOWN_PARSER,
      useClass: MarkdownHtmlRendererAdapter,
    },
    {
      provide: HTML_SANITIZER,
      useClass: SanitizeHtmlAdapter,
    },
    {
      provide: DIAGRAM_RENDERER,
      useClass: MermaidSvgRendererAdapter,
    },
    {
      provide: IMAGE_RESOLVER,
      useClass: SafeRemoteImageResolverAdapter,
    },
    {
      provide: PDF_RENDERER,
      useClass: ChromiumPdfRendererAdapter,
    },
    {
      provide: DOCUMENT_STORAGE,
      useClass: MemoryDocumentStorageAdapter,
    },
    {
      provide: MarkdownRenderingPipeline,
      useFactory: (
        markdownParser: MarkdownParserPort,
        htmlSanitizer: HtmlSanitizerPort,
        diagramRenderer: DiagramRendererPort,
        imageResolver: ImageResolverPort,
        inspectMarkdownDocument: InspectMarkdownDocumentUseCase,
        limits: DocumentLimits,
      ): MarkdownRenderingPipeline =>
        new MarkdownRenderingPipeline(
          markdownParser,
          htmlSanitizer,
          diagramRenderer,
          imageResolver,
          inspectMarkdownDocument,
          limits,
        ),
      inject: [
        MARKDOWN_PARSER,
        HTML_SANITIZER,
        DIAGRAM_RENDERER,
        IMAGE_RESOLVER,
        InspectMarkdownDocumentUseCase,
        RENDER_LIMITS,
      ],
    },
    {
      provide: PreviewMarkdownHtmlUseCase,
      useFactory: (pipeline: MarkdownRenderingPipeline) =>
        new PreviewMarkdownHtmlUseCase(pipeline),
      inject: [MarkdownRenderingPipeline],
    },
    {
      provide: RenderMarkdownToPdfUseCase,
      useFactory: (
        pipeline: MarkdownRenderingPipeline,
        pdfRenderer: PdfRendererPort,
        limits: DocumentLimits,
      ) => new RenderMarkdownToPdfUseCase(pipeline, pdfRenderer, limits),
      inject: [MarkdownRenderingPipeline, PDF_RENDERER, RENDER_LIMITS],
    },
    {
      provide: ValidateMarkdownAssetsUseCase,
      useFactory: (imageResolver: ImageResolverPort, limits: DocumentLimits) =>
        new ValidateMarkdownAssetsUseCase(imageResolver, limits),
      inject: [IMAGE_RESOLVER, RENDER_LIMITS],
    },
  ],
})
export class MarkdownPdfModule {}

function buildDocumentLimits(): DocumentLimits {
  return {
    maxMarkdownBytes: readPositiveInteger(
      'MAX_MARKDOWN_BYTES',
      DEFAULT_DOCUMENT_LIMITS.maxMarkdownBytes,
    ),
    maxImageBytes: readPositiveInteger(
      'MAX_IMAGE_BYTES',
      DEFAULT_DOCUMENT_LIMITS.maxImageBytes,
    ),
    maxImageCount: readPositiveInteger(
      'MAX_IMAGE_COUNT',
      DEFAULT_DOCUMENT_LIMITS.maxImageCount,
    ),
    maxDiagramCount: readPositiveInteger(
      'MAX_DIAGRAM_COUNT',
      DEFAULT_DOCUMENT_LIMITS.maxDiagramCount,
    ),
    maxPdfBytes: readPositiveInteger(
      'MAX_PDF_BYTES',
      DEFAULT_DOCUMENT_LIMITS.maxPdfBytes,
    ),
  };
}

function readPositiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
