import type { AuthResponseDto } from '../api/dto/auth-response.dto';
import {
  AUTH_USER_ROLES,
  type AuthSession,
  type AuthUser,
  type AuthUserRole,
} from './auth-user';

const isAuthUserRole = (value: string): value is AuthUserRole =>
  AUTH_USER_ROLES.includes(value as AuthUserRole);

const mapAuthUserRole = (role: string): AuthUserRole => {
  if (isAuthUserRole(role)) {
    return role;
  }

  throw new Error(`Unsupported auth user role: ${role}`);
};

export const mapAuthUserFromDto = (
  response: AuthResponseDto['user'],
): AuthUser => ({
  id: response.id,
  email: response.email,
  fullName: response.fullName,
  role: mapAuthUserRole(response.role),
  clinicId: response.clinicId,
});

export const mapAuthSessionFromDto = (
  response: AuthResponseDto,
): AuthSession => ({
  user: mapAuthUserFromDto(response.user),
});
