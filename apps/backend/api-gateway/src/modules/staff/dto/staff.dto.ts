import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import {
  STAFF_ROLES,
  STAFF_STATUSES,
  type StaffRole,
  type StaffStatus,
} from '@clinora/contracts-clinic';

export class CreateStaffMemberDto {
  @IsIn(STAFF_ROLES)
  role!: StaffRole;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialization?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class UpdateStaffMemberDto {
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: StaffRole;

  @IsOptional()
  @IsIn(STAFF_STATUSES)
  status?: StaffStatus;

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
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialization?: string;

  @IsOptional()
  @ValidateIf(hasNonEmptyValue)
  @IsUrl()
  @MaxLength(500)
  avatar?: string;
}

function hasNonEmptyValue(_: unknown, value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}
