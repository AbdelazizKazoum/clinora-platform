import { resolve } from 'node:path';

import type { Observable } from 'rxjs';

export const AUTH_PACKAGE_NAME = 'auth';
export const AUTH_SERVICE_NAME = 'AuthService';
export const AUTH_USER_ROLES = [
  'patient',
  'secretary',
  'doctor',
  'admin',
  'dental_assistant',
] as const;

export type AuthUserRole = (typeof AUTH_USER_ROLES)[number];

export function resolveAuthProtoPath(): string {
  return resolve(
    process.env['AUTH_PROTO_PATH'] ??
      'libs/contracts/auth/src/lib/auth.proto',
  );
}

export interface LoginRequest {
  email: string;
  password: string;
  clinicId: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
  clinicId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  clinicId: string;
}

export interface AuthReply {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenReply {
  accessToken: string;
  refreshToken: string;
}

export interface ProvisionStaffIdentityRequest {
  email: string;
  password: string;
  fullName: string;
  role: AuthUserRole;
  clinicId: string;
}

export interface UpdateStaffIdentityRequest {
  userId: string;
  clinicId: string;
  email?: string;
  fullName?: string;
  role?: AuthUserRole;
  isActive?: boolean;
}

export interface DeleteProvisionedIdentityRequest {
  userId: string;
  clinicId: string;
}

export interface DeleteProvisionedIdentityReply {
  deleted: boolean;
}

export interface AuthServiceClient {
  login(request: LoginRequest): Observable<AuthReply>;
  register(request: RegisterRequest): Observable<AuthReply>;
  refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenReply>;
  provisionStaffIdentity(
    request: ProvisionStaffIdentityRequest,
  ): Observable<UserProfile>;
  updateStaffIdentity(
    request: UpdateStaffIdentityRequest,
  ): Observable<UserProfile>;
  deleteProvisionedIdentity(
    request: DeleteProvisionedIdentityRequest,
  ): Observable<DeleteProvisionedIdentityReply>;
}
