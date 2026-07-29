import { createHmac } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import type { JwtPayload } from '../jwt-payload';
import { JwtStrategy } from './jwt.strategy';

const JWT_SECRET = 'test-access-token-secret-at-least-32-chars';

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signToken(payload: object, secret = JWT_SECRET): string {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeJson(payload);
  const unsignedToken = `${header}.${body}`;
  const signature = createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

type AuthenticationResult =
  | { outcome: 'success'; user: unknown }
  | { outcome: 'fail' }
  | { outcome: 'error' };

function authenticate(
  strategy: JwtStrategy,
  request: Partial<Request>,
): Promise<AuthenticationResult> {
  return new Promise((resolve) => {
    strategy.success = (user: unknown) => resolve({ outcome: 'success', user });
    strategy.fail = () => resolve({ outcome: 'fail' });
    strategy.error = () => resolve({ outcome: 'error' });
    strategy.authenticate(request as Request);
  });
}

describe('JwtStrategy', () => {
  const now = Math.floor(Date.now() / 1_000);
  const payload: JwtPayload = {
    user_id: 'user-123',
    clinic_id: 'clinic-456',
    role: 'doctor',
    iat: now,
    exp: now + 900,
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(JWT_SECRET),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  it('returns a supported, complete JWT payload unchanged', () => {
    expect(strategy.validate(payload)).toBe(payload);
  });

  it.each([
    ['user_id', { ...payload, user_id: '' }],
    ['clinic_id', { ...payload, clinic_id: undefined }],
    ['iat', { ...payload, iat: undefined }],
    ['exp', { ...payload, exp: undefined }],
  ])('rejects a payload with an invalid %s claim', (_claim, candidate) => {
    expect(() => strategy.validate(candidate)).toThrow(
      'Invalid authentication token payload',
    );
  });

  it('rejects an unsupported role', () => {
    expect(() => strategy.validate({ ...payload, role: 'dentist' })).toThrow(
      'Invalid authentication token payload',
    );
  });

  it('authenticates a valid bearer access token', async () => {
    const result = await authenticate(strategy, {
      headers: { authorization: `Bearer ${signToken(payload)}` },
    });

    expect(result).toEqual({ outcome: 'success', user: payload });
  });

  it('rejects a token with an invalid signature', async () => {
    const result = await authenticate(strategy, {
      headers: {
        authorization: `Bearer ${signToken(
          payload,
          'a-different-secret-that-is-also-long-enough',
        )}`,
      },
    });

    expect(result.outcome).not.toBe('success');
  });

  it('rejects an expired token', async () => {
    const result = await authenticate(strategy, {
      headers: {
        authorization: `Bearer ${signToken({
          ...payload,
          iat: now - 1_800,
          exp: now - 900,
        })}`,
      },
    });

    expect(result.outcome).not.toBe('success');
  });

  it.each([
    ['missing token', { headers: {} }],
    [
      'query-string token',
      { headers: {}, query: { token: signToken(payload) } },
    ],
    [
      'cookie token',
      { headers: {}, cookies: { access_token: signToken(payload) } },
    ],
  ])('does not authenticate a %s', async (_case, request) => {
    const result = await authenticate(strategy, request);

    expect(result.outcome).not.toBe('success');
  });
});
