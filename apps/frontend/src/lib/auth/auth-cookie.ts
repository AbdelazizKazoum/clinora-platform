export const AUTH_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-clinora.session-token'
    : 'clinora.session-token';
