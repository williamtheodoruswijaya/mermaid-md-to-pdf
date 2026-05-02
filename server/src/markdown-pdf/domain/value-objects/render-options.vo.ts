import { DomainError } from '../errors/domain-error';

export type PageSize = 'A4' | 'Letter';
export type RenderTheme = 'github-light' | 'github-dark';

export interface RenderOptionsProps {
  readonly pageSize?: PageSize;
  readonly margin?: string;
  readonly theme?: RenderTheme;
  readonly renderMermaid?: boolean;
  readonly allowRemoteImages?: boolean;
  readonly timeoutMs?: number;
  readonly filename?: string;
}

export class RenderOptions {
  private constructor(
    readonly pageSize: PageSize,
    readonly margin: string,
    readonly theme: RenderTheme,
    readonly renderMermaid: boolean,
    readonly allowRemoteImages: boolean,
    readonly timeoutMs: number,
    readonly filename: string,
  ) {}

  static create(props: RenderOptionsProps = {}): RenderOptions {
    const pageSize = props.pageSize ?? 'A4';
    const margin = props.margin ?? '16mm';
    const theme = props.theme ?? 'github-light';
    const renderMermaid = props.renderMermaid ?? true;
    const allowRemoteImages = props.allowRemoteImages ?? false;
    const timeoutMs = props.timeoutMs ?? 30_000;
    const filename = normalizePdfFilename(props.filename ?? 'document.pdf');

    if (!['A4', 'Letter'].includes(pageSize)) {
      throw new DomainError('INVALID_PAGE_SIZE', 'Unsupported page size.', {
        pageSize,
      });
    }

    if (!/^\d{1,2}(\.\d{1,2})?(mm|cm|in|px)$/.test(margin)) {
      throw new DomainError(
        'INVALID_MARGIN',
        'Margin must use mm, cm, in, or px units.',
        { margin },
      );
    }

    if (!['github-light', 'github-dark'].includes(theme)) {
      throw new DomainError('INVALID_THEME', 'Unsupported render theme.', {
        theme,
      });
    }

    if (timeoutMs < 1_000 || timeoutMs > 60_000) {
      throw new DomainError(
        'INVALID_RENDER_TIMEOUT',
        'Render timeout must be between 1000 and 60000 milliseconds.',
        { timeoutMs },
      );
    }

    return new RenderOptions(
      pageSize,
      margin,
      theme,
      renderMermaid,
      allowRemoteImages,
      timeoutMs,
      filename,
    );
  }
}

function normalizePdfFilename(filename: string): string {
  const cleanName = filename
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const fallbackName = cleanName || 'document.pdf';
  return fallbackName.toLowerCase().endsWith('.pdf')
    ? fallbackName
    : `${fallbackName}.pdf`;
}
