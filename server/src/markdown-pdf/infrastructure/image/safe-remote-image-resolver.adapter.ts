import { ApplicationError } from '../../application/errors/application-error';
import type {
  ImageResolutionPolicy,
  ImageResolverPort,
  ResolvedImage,
} from '../../application/ports/image-resolver.port';
import type { DocumentAsset } from '../../domain/value-objects/document-asset.vo';
import { assertSafeRemoteImageUrl } from './image-policy.validator';

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

export class SafeRemoteImageResolverAdapter implements ImageResolverPort {
  async resolveImage(
    reference: string,
    assets: readonly DocumentAsset[],
    policy: ImageResolutionPolicy,
  ): Promise<ResolvedImage> {
    if (reference.startsWith('attachment://')) {
      return this.resolveAttachment(reference, assets, policy.maxImageBytes);
    }

    if (reference.startsWith('data:image/')) {
      return this.resolveDataUrl(reference, policy.maxImageBytes);
    }

    if (/^https?:\/\//i.test(reference)) {
      return this.resolveRemoteImage(reference, policy);
    }

    throw new ApplicationError(
      'IMAGE_REFERENCE_UNSUPPORTED',
      'Image reference must be an attachment, data image, or HTTPS URL.',
      { reference },
    );
  }

  private resolveAttachment(
    reference: string,
    assets: readonly DocumentAsset[],
    maxImageBytes: number,
  ): ResolvedImage {
    const assetKey = decodeURIComponent(reference.replace('attachment://', ''));
    const asset = assets.find(
      (candidate) =>
        candidate.id === assetKey || candidate.filename === assetKey,
    );

    if (!asset) {
      throw new ApplicationError(
        'ATTACHMENT_IMAGE_MISSING',
        `Uploaded image "${assetKey}" was not provided.`,
        { reference },
      );
    }

    const bytes = Buffer.from(asset.dataBase64, 'base64');
    return createResolvedImage(bytes, asset.contentType, maxImageBytes);
  }

  private resolveDataUrl(
    reference: string,
    maxImageBytes: number,
  ): ResolvedImage {
    const match = reference.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) {
      throw new ApplicationError(
        'DATA_IMAGE_INVALID',
        'Data image URL must be base64 encoded.',
      );
    }

    return createResolvedImage(
      Buffer.from(match[2], 'base64'),
      match[1].toLowerCase(),
      maxImageBytes,
    );
  }

  private async resolveRemoteImage(
    reference: string,
    policy: ImageResolutionPolicy,
  ): Promise<ResolvedImage> {
    if (!policy.allowRemoteImages) {
      throw new ApplicationError(
        'REMOTE_IMAGES_DISABLED',
        'Remote images are disabled for this render request.',
        { reference },
      );
    }

    const url = new URL(reference);
    await assertSafeRemoteImageUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch(url, {
        headers: {
          accept: 'image/png,image/jpeg,image/gif,image/webp',
        },
        redirect: 'error',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApplicationError(
          'REMOTE_IMAGE_FETCH_FAILED',
          'Remote image could not be fetched.',
          { status: response.status, reference },
        );
      }

      const declaredLength = Number(response.headers.get('content-length'));
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > policy.maxImageBytes
      ) {
        throw new ApplicationError(
          'REMOTE_IMAGE_TOO_LARGE',
          'Remote image exceeds the configured size limit.',
          {
            maxImageBytes: policy.maxImageBytes,
            sizeBytes: declaredLength,
          },
          413,
        );
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType =
        response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ??
        '';

      return createResolvedImage(bytes, contentType, policy.maxImageBytes);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function createResolvedImage(
  bytes: Buffer,
  declaredContentType: string,
  maxImageBytes: number,
): ResolvedImage {
  if (bytes.byteLength > maxImageBytes) {
    throw new ApplicationError(
      'IMAGE_TOO_LARGE',
      'Image exceeds the configured size limit.',
      { maxImageBytes, sizeBytes: bytes.byteLength },
      413,
    );
  }

  const detectedContentType = detectImageMime(bytes);
  if (!detectedContentType) {
    throw new ApplicationError(
      'IMAGE_TYPE_UNSUPPORTED',
      'Image file signature is not supported.',
    );
  }

  const normalizedDeclaredContentType =
    declaredContentType === 'image/jpg' ? 'image/jpeg' : declaredContentType;

  if (
    normalizedDeclaredContentType &&
    allowedMimeTypes.has(normalizedDeclaredContentType) &&
    normalizedDeclaredContentType !== detectedContentType
  ) {
    throw new ApplicationError(
      'IMAGE_MIME_MISMATCH',
      'Image MIME type does not match its file signature.',
      {
        declaredContentType,
        detectedContentType,
      },
    );
  }

  return {
    dataUrl: `data:${detectedContentType};base64,${bytes.toString('base64')}`,
    contentType: detectedContentType,
    sizeBytes: bytes.byteLength,
  };
}

function detectImageMime(bytes: Buffer): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 6 &&
    bytes
      .slice(0, 6)
      .toString('ascii')
      .match(/^GIF8[79]a$/)
  ) {
    return 'image/gif';
  }

  if (
    bytes.length >= 12 &&
    bytes.slice(0, 4).toString('ascii') === 'RIFF' &&
    bytes.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}
