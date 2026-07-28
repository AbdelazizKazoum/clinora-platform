import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateInsuranceTemplateDto {
  @IsUUID()
  insuranceProviderId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl!: string;
}

export class UpdateInsuranceTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl?: string;
}

export class ListInsuranceTemplatesQueryDto {
  @IsOptional()
  @IsUUID()
  insuranceProviderId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseStringList(value))
  @IsArray()
  @IsUUID(undefined, { each: true })
  insuranceProviderIds?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

function parseStringList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseStringList(item) ?? []);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
