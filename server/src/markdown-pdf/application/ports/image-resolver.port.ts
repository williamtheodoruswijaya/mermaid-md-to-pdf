import type { DocumentAsset } from '../../domain/value-objects/document-asset.vo';

export const IMAGE_RESOLVER = Symbol('IMAGE_RESOLVER');

export interface ImageResolutionPolicy {
  readonly allowRemoteImages: boolean;
  readonly maxImageBytes: number;
}

export interface ResolvedImage {
  readonly dataUrl: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface ImageResolverPort {
  resolveImage(
    reference: string,
    assets: readonly DocumentAsset[],
    policy: ImageResolutionPolicy,
  ): Promise<ResolvedImage>;
}
