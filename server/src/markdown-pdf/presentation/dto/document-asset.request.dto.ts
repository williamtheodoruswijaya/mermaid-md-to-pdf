import {
  IsBase64,
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class DocumentAssetRequestDto {
  @IsString()
  @MinLength(1)
  readonly id!: string;

  @IsString()
  @MinLength(1)
  readonly filename!: string;

  @IsString()
  @IsMimeType()
  readonly contentType!: string;

  @IsString()
  @IsBase64()
  readonly dataBase64!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5_242_880)
  readonly sizeBytes?: number;
}
