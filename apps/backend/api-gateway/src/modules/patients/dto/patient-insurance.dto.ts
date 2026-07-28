import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { BooleanQuery } from './query-transformers';

export class CreatePatientInsuranceDto {
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

export class UpdatePatientInsuranceDto {
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

export class ListPatientInsurancesQueryDto {
  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  isActive?: boolean;
}

export class ListClinicPatientInsurancesQueryDto {
  @IsOptional()
  @IsUUID()
  insuranceProviderId?: string;

  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsString()
  memberId?: string;
}
