export const MARKDOWN_PARSER = Symbol('MARKDOWN_PARSER');

export interface ParsedMarkdown {
  readonly html: string;
}

export interface MarkdownParserPort {
  render(markdown: string): Promise<ParsedMarkdown>;
}
