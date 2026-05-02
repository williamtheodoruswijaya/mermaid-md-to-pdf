import { DomainError } from '../errors/domain-error';
import {
  DocumentAsset,
  DocumentAssetProps,
} from '../value-objects/document-asset.vo';

export interface DocumentLimits {
  readonly maxMarkdownBytes: number;
  readonly maxImageBytes: number;
  readonly maxImageCount: number;
  readonly maxDiagramCount: number;
  readonly maxPdfBytes: number;
}

export const DEFAULT_DOCUMENT_LIMITS: DocumentLimits = {
  maxMarkdownBytes: 1_048_576,
  maxImageBytes: 5_242_880,
  maxImageCount: 20,
  maxDiagramCount: 20,
  maxPdfBytes: 15_728_640,
};

export class MarkdownDocument {
  private constructor(
    readonly markdown: string,
    readonly assets: readonly DocumentAsset[],
  ) {}

  static create(
    markdown: string,
    assetProps: readonly DocumentAssetProps[],
    limits: DocumentLimits,
  ): MarkdownDocument {
    if (!markdown.trim()) {
      throw new DomainError(
        'MARKDOWN_REQUIRED',
        'Markdown content is required.',
      );
    }

    const markdownBytes = new TextEncoder().encode(markdown).byteLength;
    if (markdownBytes > limits.maxMarkdownBytes) {
      throw new DomainError(
        'MARKDOWN_TOO_LARGE',
        'Markdown content exceeds the configured size limit.',
        {
          maxMarkdownBytes: limits.maxMarkdownBytes,
          markdownBytes,
        },
      );
    }

    if (assetProps.length > limits.maxImageCount) {
      throw new DomainError(
        'TOO_MANY_IMAGES',
        'Too many uploaded image assets were provided.',
        {
          maxImageCount: limits.maxImageCount,
          imageCount: assetProps.length,
        },
      );
    }

    const assets = assetProps.map((asset) =>
      DocumentAsset.create(asset, limits.maxImageBytes),
    );

    return new MarkdownDocument(markdown, assets);
  }
}
