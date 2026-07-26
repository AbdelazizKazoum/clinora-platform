import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import {
  AUTH_USER_ROLES,
  type AuthUserRole,
} from '@clinora/contracts-auth';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsIn(AUTH_USER_ROLES)
  role!: AuthUserRole;

  @IsUUID()
  clinicId!: string;
}
