import puppeteer, { type Browser, type HTTPRequest } from 'puppeteer-core';
import { ApplicationError } from '../../application/errors/application-error';
import type { PdfRendererPort } from '../../application/ports/pdf-renderer.port';
import type { RenderOptions } from '../../domain/value-objects/render-options.vo';
import { createChromiumLaunchConfig } from '../browser/chromium-runtime';
import { mapPdfRenderingOptions } from './pdf-rendering-options.mapper';

export class ChromiumPdfRendererAdapter implements PdfRendererPort {
  async render(html: string, options: RenderOptions): Promise<Uint8Array> {
    let browser: Browser | undefined;

    try {
      const launchConfig = await createChromiumLaunchConfig();
      browser = await puppeteer.launch({
        args: [...launchConfig.args],
        executablePath: launchConfig.executablePath,
        headless: launchConfig.headless,
      });

      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => this.handlePageRequest(request));

      await withTimeout(
        page.setContent(html, {
          waitUntil: ['load', 'networkidle0'],
          timeout: options.timeoutMs,
        }),
        options.timeoutMs,
      );

      const pdf = await withTimeout(
        page.pdf(mapPdfRenderingOptions(options)),
        options.timeoutMs,
      );

      return new Uint8Array(pdf);
    } catch (error) {
      throw new ApplicationError(
        'PDF_RENDER_FAILED',
        error instanceof Error ? error.message : 'Failed to render PDF.',
        undefined,
        500,
      );
    } finally {
      await browser?.close();
    }
  }

  private handlePageRequest(request: HTTPRequest): void {
    const url = request.url();
    if (
      url === 'about:blank' ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      void request.continue();
      return;
    }

    void request.abort();
  }
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutTask = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Render timed out after ${timeoutMs}ms.`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([task, timeoutTask]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
