import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../jwt-payload';
import { RolesGuard } from './roles.guard';

const authenticatedUser: JwtPayload = {
  user_id: 'user-123',
  clinic_id: 'clinic-456',
  role: 'admin',
  iat: 1_700_000_000,
  exp: 1_700_000_900,
};

function createContext(request: { user?: JwtPayload }): ExecutionContext {
  const handler = (): undefined => undefined;
  class Controller {}

  Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);

  return {
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  it('allows a verified principal with an allowed role', () => {
    const context = createContext({ user: authenticatedUser });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a verified principal with a wrong role', () => {
    const context = createContext({
      user: {
        ...authenticatedUser,
        role: 'doctor',
      },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        'You do not have permission to access this resource',
      ),
    );
  });
});
