import { MarkdownDocument } from '../../domain/entities/markdown-document.entity';
import { DiagramBlock } from '../../domain/value-objects/diagram-block.vo';
import { RenderOptions } from '../../domain/value-objects/render-options.vo';
import type { RenderMarkdownInputDto } from '../dto/render-markdown-input.dto';
import type { MarkdownInspectionDto } from '../dto/markdown-inspection.dto';
import type { DiagramRendererPort } from '../ports/diagram-renderer.port';
import type { HtmlSanitizerPort } from '../ports/html-sanitizer.port';
import type { ImageResolverPort } from '../ports/image-resolver.port';
import type { MarkdownParserPort } from '../ports/markdown-parser.port';
import type { RenderLimits } from '../ports/render-limits.port';
import { ApplicationError } from '../errors/application-error';
import { InspectMarkdownDocumentUseCase } from './inspect-markdown-document.use-case';
import {
  createMarkdownImage,
  replaceMarkdownImageReferences,
  replaceMermaidBlocks,
} from './markdown-reference.utils';

export interface PreparedMarkdownDocument {
  readonly html: string;
  readonly options: RenderOptions;
  readonly metadata: MarkdownInspectionDto;
}

export class MarkdownRenderingPipeline {
  constructor(
    private readonly markdownParser: MarkdownParserPort,
    private readonly htmlSanitizer: HtmlSanitizerPort,
    private readonly diagramRenderer: DiagramRendererPort,
    private readonly imageResolver: ImageResolverPort,
    private readonly inspectMarkdownDocument: InspectMarkdownDocumentUseCase,
    private readonly limits: RenderLimits,
  ) {}

  async prepare(
    input: RenderMarkdownInputDto,
  ): Promise<PreparedMarkdownDocument> {
    const options = RenderOptions.create(input.options);
    const document = MarkdownDocument.create(
      input.markdown,
      input.assets ?? [],
      this.limits,
    );
    const inspection = this.inspectMarkdownDocument.execute(document.markdown);

    if (inspection.diagramCount > this.limits.maxDiagramCount) {
      throw new ApplicationError(
        'TOO_MANY_DIAGRAMS',
        'Too many Mermaid diagrams were provided.',
        {
          diagramCount: inspection.diagramCount,
          maxDiagramCount: this.limits.maxDiagramCount,
        },
        413,
      );
    }

    let renderableMarkdown = await replaceMarkdownImageReferences(
      document.markdown,
      async (reference) => {
        const resolvedImage = await this.imageResolver.resolveImage(
          reference.url,
          document.assets,
          {
            allowRemoteImages: options.allowRemoteImages,
            maxImageBytes: this.limits.maxImageBytes,
          },
        );

        return createMarkdownImage(
          reference.alt,
          resolvedImage.dataUrl,
          reference.title,
        );
      },
    );

    renderableMarkdown = await this.renderMermaidBlocks(
      renderableMarkdown,
      options,
    );

    const parsed = await this.markdownParser.render(renderableMarkdown);
    const sanitizedHtml = await this.htmlSanitizer.sanitize(parsed.html);

    return {
      html: createPdfDocumentHtml(sanitizedHtml.value, options),
      options,
      metadata: inspection,
    };
  }

  private async renderMermaidBlocks(
    markdown: string,
    options: RenderOptions,
  ): Promise<string> {
    if (!options.renderMermaid) {
      return markdown;
    }

    return replaceMermaidBlocks(markdown, async (block) => {
      const rendered = await this.diagramRenderer.render(
        new DiagramBlock(`mermaid-${block.index + 1}`, block.source),
      );

      return createMarkdownImage(rendered.alt, rendered.dataUrl);
    });
  }
}

function createPdfDocumentHtml(html: string, options: RenderOptions): string {
  const colors =
    options.theme === 'github-dark'
      ? {
          background: '#0f1419',
          surface: '#151b23',
          text: '#e6edf3',
          muted: '#9da7b3',
          border: '#30363d',
          code: '#1f2937',
          accent: '#2dd4bf',
        }
      : {
          background: '#f8fafc',
          surface: '#ffffff',
          text: '#172026',
          muted: '#55616d',
          border: '#d8dee4',
          code: '#f3f6fa',
          accent: '#0f766e',
        };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { margin: ${options.margin}; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: ${colors.background};
        color: ${colors.text};
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14px;
        line-height: 1.62;
      }
      .markdown-body {
        max-width: 820px;
        min-height: 100vh;
        margin: 0 auto;
        padding: 28px 32px;
        background: ${colors.surface};
      }
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.25;
        margin: 1.35em 0 0.55em;
      }
      h1 { font-size: 30px; border-bottom: 1px solid ${colors.border}; padding-bottom: 10px; }
      h2 { font-size: 23px; border-bottom: 1px solid ${colors.border}; padding-bottom: 8px; }
      h3 { font-size: 19px; }
      p { margin: 0 0 14px; }
      a { color: ${colors.accent}; }
      img {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 18px auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0;
        font-size: 13px;
      }
      th, td {
        border: 1px solid ${colors.border};
        padding: 8px 10px;
        vertical-align: top;
      }
      th { background: ${colors.code}; text-align: left; }
      pre {
        background: ${colors.code};
        border: 1px solid ${colors.border};
        border-radius: 8px;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        padding: 14px;
      }
      code {
        background: ${colors.code};
        border-radius: 4px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 0.92em;
        padding: 0.15em 0.35em;
      }
      pre code { padding: 0; background: transparent; }
      blockquote {
        border-left: 4px solid ${colors.border};
        color: ${colors.muted};
        margin: 16px 0;
        padding: 2px 0 2px 16px;
      }
      hr { border: 0; border-top: 1px solid ${colors.border}; margin: 24px 0; }
    </style>
  </head>
  <body>
    <article class="markdown-body">${html}</article>
  </body>
</html>`;
}
