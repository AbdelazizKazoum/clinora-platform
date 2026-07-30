import {
  AUTH_USER_ROLES,
  type AuthUserRole,
} from '@/features/auth/model/auth-user';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/auth/auth-cookie';
import { getToken, type JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

type AuthSessionToken = JWT & {
  user?: {
    role?: unknown;
  };
};

const isAuthUserRole = (value: unknown): value is AuthUserRole =>
  typeof value === 'string' && AUTH_USER_ROLES.includes(value as AuthUserRole);

export const getMiddlewareAuthRole = async (
  request: NextRequest,
): Promise<AuthUserRole | null> => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is required');
  }

  const token = (await getToken({
    cookieName: AUTH_SESSION_COOKIE_NAME,
    req: request,
    secret,
  })) as AuthSessionToken | null;

  const role = token?.user?.role;

  return isAuthUserRole(role) ? role : null;
};
