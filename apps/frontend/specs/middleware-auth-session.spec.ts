/** @jest-environment node */

import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { getMiddlewareAuthRole } from '../src/features/auth/api/server/middleware-auth-session';

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

const mockedGetToken = jest.mocked(getToken);
const request = new NextRequest('http://localhost:3000/dashboard');

describe('middleware auth session', () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = 'middleware-test-secret';
    mockedGetToken.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalSecret;
    }
  });

  it('treats a missing session as unauthenticated', async () => {
    mockedGetToken.mockResolvedValue(null);

    expect(await getMiddlewareAuthRole(request)).toBeNull();
  });

  it('reads the role from the encrypted Clinora session', async () => {
    mockedGetToken.mockResolvedValue({ user: { role: 'doctor' } });

    expect(await getMiddlewareAuthRole(request)).toBe('doctor');
    expect(mockedGetToken).toHaveBeenCalledWith({
      cookieName: 'clinora.session-token',
      req: request,
      secret: 'middleware-test-secret',
    });
  });

  it('rejects a session whose backend token refresh failed', async () => {
    mockedGetToken.mockResolvedValue({
      user: { role: 'admin' },
      authError: 'RefreshTokenError',
    });

    expect(await getMiddlewareAuthRole(request)).toBeNull();
  });

  it('rejects an unknown role', async () => {
    mockedGetToken.mockResolvedValue({ user: { role: 'unknown' } });

    expect(await getMiddlewareAuthRole(request)).toBeNull();
  });
});
