export interface DocumentAssetInputDto {
  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  readonly dataBase64: string;
  readonly sizeBytes?: number;
}
