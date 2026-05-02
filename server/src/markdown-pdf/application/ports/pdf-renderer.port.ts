import type { RenderOptions } from '../../domain/value-objects/render-options.vo';

export const PDF_RENDERER = Symbol('PDF_RENDERER');

export interface PdfRendererPort {
  render(html: string, options: RenderOptions): Promise<Uint8Array>;
}
