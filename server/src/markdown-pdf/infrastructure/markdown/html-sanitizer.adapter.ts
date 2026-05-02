import sanitizeHtml from 'sanitize-html';
import type { HtmlSanitizerPort } from '../../application/ports/html-sanitizer.port';
import { SanitizedHtml } from '../../domain/value-objects/sanitized-html.vo';

export class SanitizeHtmlAdapter implements HtmlSanitizerPort {
  async sanitize(html: string): Promise<SanitizedHtml> {
    return new SanitizedHtml(
      sanitizeHtml(html, {
        allowedTags: [
          'a',
          'article',
          'blockquote',
          'br',
          'code',
          'del',
          'details',
          'div',
          'em',
          'figcaption',
          'figure',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'hr',
          'img',
          'li',
          'ol',
          'p',
          'pre',
          'span',
          'strong',
          'summary',
          'table',
          'tbody',
          'td',
          'th',
          'thead',
          'tr',
          'ul',
        ],
        allowedAttributes: {
          a: ['href', 'name', 'target', 'rel'],
          code: ['class'],
          img: ['src', 'alt', 'title', 'width', 'height'],
          '*': ['class'],
        },
        allowedSchemes: ['http', 'https', 'mailto', 'data'],
        allowedSchemesByTag: {
          img: ['data', 'https'],
        },
        transformTags: {
          a: sanitizeHtml.simpleTransform('a', {
            rel: 'noopener noreferrer',
            target: '_blank',
          }),
        },
      }),
    );
  }
}
