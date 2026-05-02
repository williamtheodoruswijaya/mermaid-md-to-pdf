import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DocumentAssetRequestDto } from './document-asset.request.dto';
import { RenderOptionsRequestDto } from './render-options.request.dto';

export class RenderMarkdownRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1_048_576)
  readonly markdown!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RenderOptionsRequestDto)
  readonly options?: RenderOptionsRequestDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DocumentAssetRequestDto)
  readonly assets?: readonly DocumentAssetRequestDto[];
}
