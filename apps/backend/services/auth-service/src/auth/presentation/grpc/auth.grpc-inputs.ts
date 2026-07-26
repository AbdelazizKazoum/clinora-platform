import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
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
