import { ForbiddenException, type ExecutionContext } from '@nestjs/common';

import type { JwtPayload } from '../jwt-payload';
import { ClinicScopeGuard } from './clinic-scope.guard';

const authenticatedUser: JwtPayload = {
  user_id: 'user-123',
  clinic_id: 'clinic-456',
  role: 'doctor',
  iat: 1_700_000_000,
  exp: 1_700_000_900,
};

function createContext(request: {
  user?: JwtPayload;
  params?: {
    clinicId?: string;
  };
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('ClinicScopeGuard', () => {
  let guard: ClinicScopeGuard;

  beforeEach(() => {
    guard = new ClinicScopeGuard();
  });

  it('allows a verified principal with a matching clinic', () => {
    const context = createContext({
      user: authenticatedUser,
      params: { clinicId: 'clinic-456' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a verified principal with a wrong clinic', () => {
    const context = createContext({
      user: authenticatedUser,
      params: { clinicId: 'clinic-789' },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        "You do not have access to this clinic's resources",
      ),
    );
  });

  it('rejects a missing principal', () => {
    const context = createContext({
      params: { clinicId: 'clinic-456' },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        "You do not have access to this clinic's resources",
      ),
    );
  });

  it('rejects a missing route clinic ID', () => {
    const context = createContext({
      user: authenticatedUser,
      params: {},
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        "You do not have access to this clinic's resources",
      ),
    );
  });
});
