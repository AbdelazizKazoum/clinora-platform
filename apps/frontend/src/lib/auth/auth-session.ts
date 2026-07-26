import 'server-only';

import { getToken, type JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export const AUTH_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const AUTH_SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-clinora.session-token'
    : 'clinora.session-token';

export interface BackendTokenUpdate {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  authError?: undefined;
}

export const readJwtExpiration = (token: string): number => {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return 0;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp?: unknown };

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export const getServerAuthToken = async (
  request: NextRequest,
): Promise<JWT | null> => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is required');
  }

  return getToken({
    cookieName: AUTH_SESSION_COOKIE_NAME,
    req: request,
    secret,
  });
};

export const hasBackendTokens = (
  token: JWT | null,
): token is JWT &
  Required<
    Pick<JWT, 'accessToken' | 'refreshToken' | 'accessTokenExpiresAt'>
  > =>
  Boolean(
    token &&
      typeof token.accessToken === 'string' &&
      typeof token.refreshToken === 'string' &&
      typeof token.accessTokenExpiresAt === 'number',
  );
