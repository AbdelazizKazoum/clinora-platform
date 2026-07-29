import { UnauthorizedException } from '@nestjs/common';

import type { JwtPayload } from '../jwt-payload';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const payload: JwtPayload = {
    user_id: 'user-123',
    clinic_id: 'clinic-456',
    role: 'doctor',
    iat: 1_700_000_000,
    exp: 1_700_000_900,
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('returns an authenticated principal', () => {
    expect(guard.handleRequest(null, payload)).toBe(payload);
  });

  it.each([
    ['a missing principal', null, false],
    ['an internal authentication error', new Error('signature details'), null],
  ])('returns a stable 401 for %s', (_case, error, user) => {
    expect(() => guard.handleRequest(error, user)).toThrow(
      new UnauthorizedException('Invalid or missing authentication token'),
    );
  });
});
