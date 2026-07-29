import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ClinicLocale } from '../../domain/enums/clinic-locale.enum';
import { StaffRole } from '../../domain/enums/staff-role.enum';
import { StaffStatus } from '../../domain/enums/staff-status.enum';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class ClinicIdInput {
  @IsUUID()
  clinicId!: string;
}

export class CreateClinicInput {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

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
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsEnum(ClinicLocale)
  locale?: ClinicLocale;
}

export class UpsertWorkingHoursEntryInput {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsOptional()
  @Matches(TIME_PATTERN)
  openTime?: string;

  @IsOptional()
  @Matches(TIME_PATTERN)
  closeTime?: string;

  @IsBoolean()
  isClosed!: boolean;
}

export class UpsertWorkingHoursInput {
  @IsUUID()
  clinicId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => UpsertWorkingHoursEntryInput)
  entries!: UpsertWorkingHoursEntryInput[];
}

export class GetStaffMemberInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  userId!: string;
}

export class ListStaffMembersInput {
  @IsUUID()
  clinicId!: string;
}

export class CreateStaffMemberInput {
  @IsUUID()
  clinicId!: string;

  @IsEnum(StaffRole)
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

export class UpdateStaffMemberInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  staffMemberId!: string;

  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @IsOptional()
  @IsEnum(StaffStatus)
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
  @Transform(toNullable)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform(toNullable)
  @IsString()
  @MaxLength(255)
  specialization?: string | null;

  @IsOptional()
  @Transform(toNullable)
  @IsUrl()
  @MaxLength(500)
  avatar?: string | null;
}

export class DeleteStaffMemberInput {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  staffMemberId!: string;
}

function toNullable({ value }: { value: unknown }): unknown {
  return value === '' ? null : value;
}
