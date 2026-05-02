import type { DocumentLimits } from '../../domain/entities/markdown-document.entity';

export const RENDER_LIMITS = Symbol('RENDER_LIMITS');

export type RenderLimits = DocumentLimits;
