import type { SanitizedHtml } from '../../domain/value-objects/sanitized-html.vo';

export const HTML_SANITIZER = Symbol('HTML_SANITIZER');

export interface HtmlSanitizerPort {
  sanitize(html: string): Promise<SanitizedHtml>;
}
