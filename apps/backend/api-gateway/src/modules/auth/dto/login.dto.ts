import { IsEmail, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsUUID()
  clinicId!: string;
}
