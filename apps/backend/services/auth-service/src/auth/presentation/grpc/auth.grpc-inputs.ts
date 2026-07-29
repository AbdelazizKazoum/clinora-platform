import {
  IsEmail,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../domain/enums/user-role.enum';

export class LoginInput {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsUUID()
  clinicId!: string;
}

export class RegisterInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsUUID()
  clinicId!: string;
}

export class RefreshTokenInput {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ProvisionStaffIdentityInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsUUID()
  clinicId!: string;
}

export class UpdateStaffIdentityInput {
  @IsUUID()
  userId!: string;

  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeleteProvisionedIdentityInput {
  @IsUUID()
  userId!: string;

  @IsUUID()
  clinicId!: string;
}
