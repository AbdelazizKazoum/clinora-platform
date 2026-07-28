import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  PATIENT_DOCUMENT_TYPES,
  type PatientDocumentType,
} from '@clinora/contracts-patient';

export class CreatePatientDocumentDto {
  @IsIn(PATIENT_DOCUMENT_TYPES)
  type!: PatientDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl!: string;
}

export class UpdatePatientDocumentDto {
  @IsOptional()
  @IsIn(PATIENT_DOCUMENT_TYPES)
  type?: PatientDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl?: string;
}

export class ListPatientDocumentsQueryDto {
  @IsOptional()
  @IsIn(PATIENT_DOCUMENT_TYPES)
  type?: PatientDocumentType;
}

export class ListClinicPatientDocumentsQueryDto {
  @IsOptional()
  @IsIn(PATIENT_DOCUMENT_TYPES)
  type?: PatientDocumentType;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseStringList(value))
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];
}

export class DeleteManyPatientDocumentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids!: string[];
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
