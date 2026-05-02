import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer-core';
import type {
  DiagramRendererPort,
  RenderedDiagram,
} from '../../application/ports/diagram-renderer.port';
import type { DiagramBlock } from '../../domain/value-objects/diagram-block.vo';
import { createChromiumLaunchConfig } from '../browser/chromium-runtime';

interface MermaidRenderResult {
  readonly svg: string;
}

export class MermaidSvgRendererAdapter implements DiagramRendererPort {
  private mermaidBundlePromise: Promise<string> | undefined;

  async render(block: DiagramBlock): Promise<RenderedDiagram> {
    try {
      const svg = await this.renderWithBrowser(block);

      return {
        dataUrl: createSvgDataUrl(svg),
        contentType: 'image/svg+xml',
        alt: 'Mermaid diagram',
      };
    } catch (error) {
      return {
        dataUrl: createSvgDataUrl(createFallbackSvg(block, error)),
        contentType: 'image/svg+xml',
        alt: 'Mermaid diagram fallback',
      };
    }
  }

  private async renderWithBrowser(block: DiagramBlock): Promise<string> {
    const [launchConfig, mermaidBundle] = await Promise.all([
      createChromiumLaunchConfig(),
      this.loadMermaidBundle(),
    ]);
    let browser: Browser | undefined;

    try {
      browser = await puppeteer.launch({
        args: [...launchConfig.args],
        executablePath: launchConfig.executablePath,
        headless: launchConfig.headless,
      });

      const page = await browser.newPage();
      await page.setJavaScriptEnabled(true);
      await page.setContent(
        `<html><body><div id="render"></div><script>${mermaidBundle}</script></body></html>`,
        { waitUntil: 'load' },
      );

      const result = await page.evaluate(
        async (source, id) => {
          type MermaidApi = {
            initialize: (config: Record<string, unknown>) => void;
            render: (
              id: string,
              source: string,
            ) => Promise<{ readonly svg: string }>;
          };
          const mermaid = (globalThis as { readonly mermaid?: MermaidApi })
            .mermaid;

          if (!mermaid) {
            throw new Error('Mermaid runtime is unavailable.');
          }

          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'default',
          });

          return mermaid.render(id, source);
        },
        block.source,
        block.id,
      );

      if (!isMermaidRenderResult(result)) {
        throw new Error('Mermaid returned an invalid SVG payload.');
      }

      return result.svg;
    } finally {
      await browser?.close();
    }
  }

  private loadMermaidBundle(): Promise<string> {
    this.mermaidBundlePromise ??= readFile(resolveMermaidBundlePath(), 'utf8');
    return this.mermaidBundlePromise;
  }
}

function resolveMermaidBundlePath(): string {
  const requireFromCurrentFile = createRequire(__filename);
  const packageJsonPath = requireFromCurrentFile.resolve(
    'mermaid/package.json',
  );

  return join(dirname(packageJsonPath), 'dist', 'mermaid.min.js');
}

function isMermaidRenderResult(value: unknown): value is MermaidRenderResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'svg' in value &&
    typeof (value as { readonly svg?: unknown }).svg === 'string'
  );
}

function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString(
    'base64',
  )}`;
}

function createFallbackSvg(block: DiagramBlock, error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Mermaid rendering failed.';
  const sourceLines = block.source.split(/\r?\n/).slice(0, 12);
  const height = Math.max(180, 92 + sourceLines.length * 20);
  const escapedLines = sourceLines.map((line) => escapeXml(line));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="${height}" viewBox="0 0 920 ${height}" role="img" aria-label="Mermaid diagram fallback">
  <rect width="920" height="${height}" rx="14" fill="#f8fafc" stroke="#ccd5df"/>
  <text x="28" y="38" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#172026">Mermaid diagram</text>
  <text x="28" y="64" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${escapeXml(
    message,
  )}</text>
  ${escapedLines
    .map(
      (line, index) =>
        `<text x="28" y="${100 + index * 20}" font-family="Consolas, monospace" font-size="13" fill="#26323f">${line}</text>`,
    )
    .join('')}
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
