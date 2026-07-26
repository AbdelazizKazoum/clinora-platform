import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { DocumentType } from '../../domain/enums/document-type.enum';
import { PatientGender } from '../../domain/enums/patient-gender.enum';
import { PatientStatus } from '../../domain/enums/patient-status.enum';

export class TenantRecordInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  id!: string;
}

export class CreatePatientInput {
  @IsUUID()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}

export class UpdatePatientInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsEnum(PatientGender)
  gender?: PatientGender | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  address?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  allergies?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  chronicConditions?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  currentMedications?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  medicalNotes?: string | null;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}

export class ListPatientsInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'createdAt', 'updatedAt'])
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class GetPatientByUserIdInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  userId!: string;
}

export class SearchPatientsByNameInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class ListInsuranceProvidersInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateInsuranceProviderInput {
  @IsUUID()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateInsuranceProviderInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  providerId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(50)
  code?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListInsuranceTemplatesInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  providerIds: string[] = [];

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateInsuranceTemplateInput {
  @IsUUID()
  clinicId!: string;

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

export class UpdateInsuranceTemplateInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  templateId!: string;

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

export class ListPatientInsurancesInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListClinicPatientInsurancesInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  insuranceProviderId?: string;
}

export class CreatePatientInsuranceInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsUUID()
  insuranceProviderId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  memberId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePatientInsuranceInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  insuranceId!: string;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(100)
  policyNumber?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(100)
  memberId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetAllPatientInsurancesActiveInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsBoolean()
  isActive!: boolean;
}

export class ListPatientDocumentsInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;
}

export class ListClinicPatientDocumentsInput {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreatePatientDocumentInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  patientId!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl!: string;
}

export class UpdatePatientDocumentInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl?: string;
}

export class DeleteManyPatientDocumentsInput {
  @IsUUID()
  clinicId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

function toNullable({ value }: { value: unknown }): unknown {
  return value === '' ? null : value;
}
