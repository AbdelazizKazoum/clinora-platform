import type { AuthUserRole } from '@clinora/contracts-auth';

/**
 * Verified access-token claims as issued by the auth service.
 * Wire names are intentionally preserved on request.user.
 */
export interface JwtPayload {
  user_id: string;
  clinic_id: string;
  role: AuthUserRole;
  iat: number;
  exp: number;
}
