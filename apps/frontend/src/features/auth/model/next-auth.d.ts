import type { DefaultSession } from 'next-auth';
import type { AuthUser } from './auth-user';

declare module 'next-auth' {
  interface Session {
    authError?: 'RefreshTokenError';
    user: AuthUser & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpiresAt?: number;
    authError?: 'RefreshTokenError';
    refreshToken?: string;
    user?: AuthUser;
  }
}
