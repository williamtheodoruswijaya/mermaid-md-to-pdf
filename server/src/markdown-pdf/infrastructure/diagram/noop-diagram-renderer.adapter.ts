import type {
  DiagramRendererPort,
  RenderedDiagram,
} from '../../application/ports/diagram-renderer.port';
import type { DiagramBlock } from '../../domain/value-objects/diagram-block.vo';

export class NoopDiagramRendererAdapter implements DiagramRendererPort {
  async render(block: DiagramBlock): Promise<RenderedDiagram> {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160" viewBox="0 0 800 160">
  <rect width="800" height="160" rx="12" fill="#f8fafc" stroke="#ccd5df"/>
  <text x="24" y="45" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#172026">Mermaid rendering disabled</text>
  <text x="24" y="82" font-family="Consolas, monospace" font-size="13" fill="#26323f">${escapeXml(
    block.source.slice(0, 180),
  )}</text>
</svg>`;

    return {
      dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString(
        'base64',
      )}`,
      contentType: 'image/svg+xml',
      alt: 'Mermaid diagram disabled',
    };
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
