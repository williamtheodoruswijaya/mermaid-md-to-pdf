import MarkdownIt from 'markdown-it';
import type {
  MarkdownParserPort,
  ParsedMarkdown,
} from '../../application/ports/markdown-parser.port';

export class MarkdownHtmlRendererAdapter implements MarkdownParserPort {
  private readonly markdown = new MarkdownIt({
    breaks: false,
    html: false,
    linkify: true,
    typographer: true,
  });

  constructor() {
    this.markdown.validateLink = (url: string) => {
      if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(url)) {
        return true;
      }

      return /^(https?:|mailto:|#)/i.test(url);
    };
  }

  async render(markdown: string): Promise<ParsedMarkdown> {
    return {
      html: this.markdown.render(markdown),
    };
  }
}
