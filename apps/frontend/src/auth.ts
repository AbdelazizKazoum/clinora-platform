import axios from 'axios';
import NextAuth, {
  type NextAuthResult,
  type Session,
} from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authenticateAtGateway, refreshGatewaySession } from '@/features/auth/api/server/gateway-auth';
import { mapAuthUserFromDto } from '@/features/auth/model/auth.mapper';
import type { AuthUser } from '@/features/auth/model';
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
  readJwtExpiration,
  type BackendTokenUpdate,
} from '@/lib/auth/auth-session';

interface AuthenticatedUser extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const isBackendTokenUpdate = (
  value: unknown,
): value is BackendTokenUpdate => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const update = value as Record<string, unknown>;

  return (
    typeof update.accessToken === 'string' &&
    typeof update.refreshToken === 'string' &&
    typeof update.accessTokenExpiresAt === 'number'
  );
};

const authResult: NextAuthResult = NextAuth({
  cookies: {
    sessionToken: {
      name: AUTH_SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/split/sign-in',
  },
  providers: [
    Credentials({
      credentials: {
        clinicId: { type: 'text' },
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const command = {
          clinicId: asString(credentials.clinicId),
          email: asString(credentials.email),
          password: asString(credentials.password),
        };

        if (!command.clinicId || !command.email || !command.password) {
          return null;
        }

        try {
          const response = await authenticateAtGateway(command);
          const user = mapAuthUserFromDto(response.user);

          return {
            ...user,
            accessToken: response.accessToken,
            name: user.fullName,
            refreshToken: response.refreshToken,
          } satisfies AuthenticatedUser & { name: string };
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
  session: {
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authenticatedUser = user as AuthenticatedUser;

        token.accessToken = authenticatedUser.accessToken;
        token.accessTokenExpiresAt = readJwtExpiration(
          authenticatedUser.accessToken,
        );
        token.authError = undefined;
        token.refreshToken = authenticatedUser.refreshToken;
        token.user = {
          clinicId: authenticatedUser.clinicId,
          email: authenticatedUser.email,
          fullName: authenticatedUser.fullName,
          id: authenticatedUser.id,
          role: authenticatedUser.role,
        };

        return token;
      }

      if (trigger === 'update' && isBackendTokenUpdate(session)) {
        token.accessToken = session.accessToken;
        token.accessTokenExpiresAt = session.accessTokenExpiresAt;
        token.authError = undefined;
        token.refreshToken = session.refreshToken;

        return token;
      }

      if (
        typeof token.accessTokenExpiresAt !== 'number' ||
        Date.now() < token.accessTokenExpiresAt - 30_000
      ) {
        return token;
      }

      if (typeof token.refreshToken !== 'string') {
        token.authError = 'RefreshTokenError';
        return token;
      }

      try {
        return {
          ...token,
          ...(await refreshGatewaySession(token.refreshToken)),
          authError: undefined,
        };
      } catch {
        token.accessToken = undefined;
        token.authError = 'RefreshTokenError';
        token.refreshToken = undefined;
        return token;
      }
    },
    session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
          name: token.user.fullName,
        };
      }

      session.authError = token.authError;
      return session;
    },
  },
});

export const auth: NextAuthResult['auth'] = authResult.auth;
export const handlers: NextAuthResult['handlers'] = authResult.handlers;

export const updateBackendAuthSession = async (
  update: BackendTokenUpdate,
): Promise<void> => {
  await authResult.unstable_update(update as unknown as Partial<Session>);
};
