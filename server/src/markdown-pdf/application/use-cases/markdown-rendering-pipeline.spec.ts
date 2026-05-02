import { SanitizedHtml } from '../../domain/value-objects/sanitized-html.vo';
import type { DiagramRendererPort } from '../ports/diagram-renderer.port';
import type { HtmlSanitizerPort } from '../ports/html-sanitizer.port';
import type { ImageResolverPort } from '../ports/image-resolver.port';
import type { MarkdownParserPort } from '../ports/markdown-parser.port';
import { InspectMarkdownDocumentUseCase } from './inspect-markdown-document.use-case';
import { MarkdownRenderingPipeline } from './markdown-rendering-pipeline';

describe('MarkdownRenderingPipeline', () => {
  it('replaces Mermaid and attachment references before parsing', async () => {
    const markdownParser: MarkdownParserPort = {
      render: jest.fn(async (markdown: string) => ({
        html: `<p>${markdown}</p>`,
      })),
    };
    const htmlSanitizer: HtmlSanitizerPort = {
      sanitize: jest.fn(async (html: string) => new SanitizedHtml(html)),
    };
    const diagramRenderer: DiagramRendererPort = {
      render: jest.fn(async () => ({
        dataUrl: 'data:image/svg+xml;base64,PHN2ZyAvPg==',
        contentType: 'image/svg+xml' as const,
        alt: 'Mermaid diagram',
      })),
    };
    const imageResolver: ImageResolverPort = {
      resolveImage: jest.fn(async () => ({
        dataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
        contentType: 'image/png',
        sizeBytes: 68,
      })),
    };

    const pipeline = new MarkdownRenderingPipeline(
      markdownParser,
      htmlSanitizer,
      diagramRenderer,
      imageResolver,
      new InspectMarkdownDocumentUseCase(),
      {
        maxMarkdownBytes: 1_048_576,
        maxImageBytes: 5_242_880,
        maxImageCount: 20,
        maxDiagramCount: 20,
        maxPdfBytes: 15_728_640,
      },
    );

    await pipeline.prepare({
      markdown:
        '![Logo](attachment://logo.png)\n\n```mermaid\ngraph TD\nA-->B\n```',
      assets: [
        {
          id: 'logo',
          filename: 'logo.png',
          contentType: 'image/png',
          dataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
          sizeBytes: 68,
        },
      ],
    });

    expect(markdownParser.render).toHaveBeenCalledWith(
      expect.stringContaining('data:image/svg+xml;base64'),
    );
    expect(markdownParser.render).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64'),
    );
  });
});
