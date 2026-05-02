import type { PDFOptions } from 'puppeteer-core';
import type { RenderOptions } from '../../domain/value-objects/render-options.vo';

export function mapPdfRenderingOptions(options: RenderOptions): PDFOptions {
  return {
    format: options.pageSize,
    margin: {
      bottom: options.margin,
      left: options.margin,
      right: options.margin,
      top: options.margin,
    },
    preferCSSPageSize: false,
    printBackground: true,
  };
}
