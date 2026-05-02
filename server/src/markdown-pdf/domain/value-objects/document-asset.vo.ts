import { DomainError } from '../errors/domain-error';

export interface DocumentAssetProps {
  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  readonly dataBase64: string;
  readonly sizeBytes?: number;
}

export class DocumentAsset {
  private constructor(private readonly props: Required<DocumentAssetProps>) {}

  static create(
    props: DocumentAssetProps,
    maxSizeBytes: number,
  ): DocumentAsset {
    const normalized: Required<DocumentAssetProps> = {
      id: props.id.trim(),
      filename: props.filename.trim(),
      contentType: props.contentType.trim().toLowerCase(),
      dataBase64: props.dataBase64.trim(),
      sizeBytes: props.sizeBytes ?? estimateBase64Bytes(props.dataBase64),
    };

    if (!normalized.id) {
      throw new DomainError('ASSET_ID_REQUIRED', 'Asset ID is required.');
    }

    if (!normalized.filename) {
      throw new DomainError(
        'ASSET_FILENAME_REQUIRED',
        'Asset filename is required.',
      );
    }

    if (!normalized.dataBase64) {
      throw new DomainError(
        'ASSET_DATA_REQUIRED',
        `Asset "${normalized.filename}" is missing file data.`,
      );
    }

    if (normalized.sizeBytes > maxSizeBytes) {
      throw new DomainError(
        'ASSET_TOO_LARGE',
        `Asset "${normalized.filename}" exceeds the image size limit.`,
        { maxSizeBytes, sizeBytes: normalized.sizeBytes },
      );
    }

    return new DocumentAsset(normalized);
  }

  get id(): string {
    return this.props.id;
  }

  get filename(): string {
    return this.props.filename;
  }

  get contentType(): string {
    return this.props.contentType;
  }

  get dataBase64(): string {
    return this.props.dataBase64;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  toJSON(): Required<DocumentAssetProps> {
    return this.props;
  }
}

function estimateBase64Bytes(value: string): number {
  const cleanValue = value.replace(/\s/g, '');
  const padding = cleanValue.endsWith('==')
    ? 2
    : cleanValue.endsWith('=')
      ? 1
      : 0;

  return Math.floor((cleanValue.length * 3) / 4) - padding;
}
