import type { AuthUserRole } from '@clinora/contracts-auth';
import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '@common/auth/decorators/roles.decorator';
import { ClinicScopeGuard } from '@common/auth/guards/clinic-scope.guard';
import { JwtAuthGuard } from '@common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/auth/guards/roles.guard';
import type { JwtPayload } from '@common/auth/jwt-payload';

import { StaffController } from './staff.controller';

const clinicId = '10000000-0000-4000-8000-000000000001';
const otherClinicId = '10000000-0000-4000-8000-000000000002';
const userId = '30000000-0000-4000-8000-000000000001';

const staffRouteHandlers = [
  'listStaffMembers',
  'createStaffMember',
  'getStaffMember',
  'updateStaffMember',
] as const satisfies readonly (keyof StaffController)[];

type StaffRouteHandler = (typeof staffRouteHandlers)[number];

const adminUser = createUser('admin', clinicId);

function createUser(role: AuthUserRole, scopedClinicId: string): JwtPayload {
  return {
    user_id: userId,
    clinic_id: scopedClinicId,
    role,
    iat: 1,
    exp: 2,
  };
}

function createContext(
  handlerName: StaffRouteHandler,
  request: {
    user?: JwtPayload;
    params?: {
      clinicId?: string;
    };
  },
): ExecutionContext {
  return {
    getHandler: () => StaffController.prototype[handlerName],
    getClass: () => StaffController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function authorizeStaffRoute(
  handlerName: StaffRouteHandler,
  request: {
    user?: JwtPayload;
    params?: {
      clinicId?: string;
    };
  },
): boolean {
  const context = createContext(handlerName, request);
  const jwtGuard = new JwtAuthGuard();
  const rolesGuard = new RolesGuard(new Reflector());
  const clinicScopeGuard = new ClinicScopeGuard();

  jwtGuard.handleRequest(null, request.user ?? null);
  rolesGuard.canActivate(context);
  clinicScopeGuard.canActivate(context);

  return true;
}

describe(`${StaffController.name} authorization`, () => {
  it('protects every staff route with JWT, admin role, and clinic scope guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      StaffController,
    ) as unknown[];
    const roles = Reflect.getMetadata(ROLES_KEY, StaffController);

    expect(guards).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard, ClinicScopeGuard]),
    );
    expect(roles).toEqual(['admin']);

    for (const handlerName of staffRouteHandlers) {
      expect(StaffController.prototype[handlerName]).toBeInstanceOf(Function);
    }
  });

  it.each(staffRouteHandlers)(
    'rejects missing tokens before %s reaches staff orchestration',
    (handlerName) => {
      expect(() =>
        authorizeStaffRoute(handlerName, {
          params: { clinicId },
        }),
      ).toThrow(UnauthorizedException);
    },
  );

  it.each(staffRouteHandlers)(
    'rejects non-admin callers before %s reaches staff orchestration',
    (handlerName) => {
      expect(() =>
        authorizeStaffRoute(handlerName, {
          user: createUser('doctor', clinicId),
          params: { clinicId },
        }),
      ).toThrow(ForbiddenException);
    },
  );

  it.each(staffRouteHandlers)(
    'rejects admins scoped to another clinic before %s reaches staff orchestration',
    (handlerName) => {
      expect(() =>
        authorizeStaffRoute(handlerName, {
          user: createUser('admin', otherClinicId),
          params: { clinicId },
        }),
      ).toThrow(ForbiddenException);
    },
  );

  it.each(staffRouteHandlers)(
    'allows admins scoped to the route clinic through %s authorization',
    (handlerName) => {
      expect(
        authorizeStaffRoute(handlerName, {
          user: adminUser,
          params: { clinicId },
        }),
      ).toBe(true);
    },
  );
});
