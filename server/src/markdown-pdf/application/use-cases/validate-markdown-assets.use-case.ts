import { MarkdownDocument } from '../../domain/entities/markdown-document.entity';
import type { RenderMarkdownInputDto } from '../dto/render-markdown-input.dto';
import type { ImageResolverPort } from '../ports/image-resolver.port';
import type { RenderLimits } from '../ports/render-limits.port';
import { extractMarkdownImageReferences } from './markdown-reference.utils';

export interface AssetValidationItem {
  readonly reference: string;
  readonly valid: boolean;
  readonly message: string;
}

export class ValidateMarkdownAssetsUseCase {
  constructor(
    private readonly imageResolver: ImageResolverPort,
    private readonly limits: RenderLimits,
  ) {}

  async execute(
    input: RenderMarkdownInputDto,
  ): Promise<readonly AssetValidationItem[]> {
    const document = MarkdownDocument.create(
      input.markdown,
      input.assets ?? [],
      this.limits,
    );
    const options = input.options ?? {};
    const imageReferences = extractMarkdownImageReferences(document.markdown);

    return Promise.all(
      imageReferences.map(async (image) => {
        try {
          await this.imageResolver.resolveImage(image.url, document.assets, {
            allowRemoteImages: options.allowRemoteImages ?? false,
            maxImageBytes: this.limits.maxImageBytes,
          });

          return {
            reference: image.url,
            valid: true,
            message: 'Image reference is valid.',
          };
        } catch (error) {
          return {
            reference: image.url,
            valid: false,
            message:
              error instanceof Error
                ? error.message
                : 'Image reference is invalid.',
          };
        }
      }),
    );
  }
}
