import type { AuthResponseDto } from '../api/dto/auth-response.dto';
import {
  AUTH_USER_ROLES,
  type AuthSession,
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

export const mapAuthSessionFromDto = (
  response: AuthResponseDto,
): AuthSession => ({
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
  user: {
    id: response.user.id,
    email: response.user.email,
    fullName: response.user.fullName,
    role: mapAuthUserRole(response.user.role),
    clinicId: response.user.clinicId,
  },
});
