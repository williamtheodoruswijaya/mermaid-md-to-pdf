import type { DiagramBlock } from '../../domain/value-objects/diagram-block.vo';

export const DIAGRAM_RENDERER = Symbol('DIAGRAM_RENDERER');

export interface RenderedDiagram {
  readonly dataUrl: string;
  readonly contentType: 'image/svg+xml' | 'image/png';
  readonly alt: string;
}

export interface DiagramRendererPort {
  render(block: DiagramBlock): Promise<RenderedDiagram>;
}
