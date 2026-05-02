import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer-core';
import type {
  DiagramRendererPort,
  RenderedDiagram,
} from '../../application/ports/diagram-renderer.port';
import type { DiagramBlock } from '../../domain/value-objects/diagram-block.vo';
import {
  createChromiumLaunchConfig,
  isChromiumLaunchBusyError,
  type ChromiumLaunchConfig,
} from '../browser/chromium-runtime';

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
      browser = await launchBrowserWithRetry(launchConfig);

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
  const candidates = [
    join(process.cwd(), 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
    join(
      process.cwd(),
      'server',
      'node_modules',
      'mermaid',
      'dist',
      'mermaid.min.js',
    ),
    join(
      dirname(__filename),
      '..',
      '..',
      '..',
      '..',
      'node_modules',
      'mermaid',
      'dist',
      'mermaid.min.js',
    ),
  ];

  const bundlePath = candidates.find((candidate) => existsSync(candidate));
  if (!bundlePath) {
    throw new Error(
      `Mermaid browser bundle was not found. Checked: ${candidates.join(', ')}`,
    );
  }

  return bundlePath;
}

async function launchBrowserWithRetry(
  launchConfig: ChromiumLaunchConfig,
): Promise<Browser> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await puppeteer.launch({
        args: [...launchConfig.args],
        executablePath: launchConfig.executablePath,
        headless: launchConfig.headless,
      });
    } catch (error) {
      if (!isChromiumLaunchBusyError(error) || attempt === 3) {
        throw error;
      }

      await wait(250 * attempt);
    }
  }

  throw new Error('Failed to launch Chromium.');
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
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
