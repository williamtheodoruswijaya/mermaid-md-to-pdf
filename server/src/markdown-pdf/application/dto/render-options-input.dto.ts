import type {
  PageSize,
  RenderTheme,
} from '../../domain/value-objects/render-options.vo';

export interface RenderOptionsInputDto {
  readonly pageSize?: PageSize;
  readonly margin?: string;
  readonly theme?: RenderTheme;
  readonly renderMermaid?: boolean;
  readonly allowRemoteImages?: boolean;
  readonly timeoutMs?: number;
  readonly filename?: string;
}
