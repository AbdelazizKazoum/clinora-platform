export const AUTH_USER_ROLES = [
  'patient',
  'secretary',
  'doctor',
  'admin',
  'dental_assistant',
] as const;

export type AuthUserRole = (typeof AUTH_USER_ROLES)[number];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AuthUserRole;
  clinicId: string;
}

export interface AuthSession {
  user: AuthUser;
}
