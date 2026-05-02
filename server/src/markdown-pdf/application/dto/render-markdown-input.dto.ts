import type { DocumentAssetInputDto } from './document-asset-input.dto';
import type { RenderOptionsInputDto } from './render-options-input.dto';

export interface RenderMarkdownInputDto {
  readonly markdown: string;
  readonly options?: RenderOptionsInputDto;
  readonly assets?: readonly DocumentAssetInputDto[];
}
