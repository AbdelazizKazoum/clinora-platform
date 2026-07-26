import type { AuthUserRole } from './auth-user';

export interface LoginCommand {
  email: string;
  password: string;
  clinicId: string;
}

export interface RegisterCommand extends LoginCommand {
  fullName: string;
  role: AuthUserRole;
}
