import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import type {
  PageSize,
  RenderTheme,
} from '../../domain/value-objects/render-options.vo';

export class RenderOptionsRequestDto {
  @IsOptional()
  @IsIn(['A4', 'Letter'])
  readonly pageSize?: PageSize;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}(\.\d{1,2})?(mm|cm|in|px)$/)
  readonly margin?: string;

  @IsOptional()
  @IsIn(['github-light', 'github-dark'])
  readonly theme?: RenderTheme;

  @IsOptional()
  @IsBoolean()
  readonly renderMermaid?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly allowRemoteImages?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  readonly timeoutMs?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  readonly filename?: string;
}
