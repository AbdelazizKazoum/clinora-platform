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

import { WaitingRoomController } from './waiting-room.controller';

const clinicId = '10000000-0000-4000-8000-000000000001';
const otherClinicId = '10000000-0000-4000-8000-000000000002';
const userId = '30000000-0000-4000-8000-000000000001';

const readRoles = ['admin', 'doctor', 'secretary', 'dental_assistant'] as const;
const commandRoles = ['admin', 'secretary', 'dental_assistant'] as const;
const chairManagementRoles = ['admin', 'secretary'] as const;

const routeRoles = {
  getWaitingRoomState: readRoles,
  updateWaitingRoomStatus: commandRoles,
  updateWaitingRoomNotes: commandRoles,
  assignWaitingRoomChair: commandRoles,
  reorderWaitingRoomEntries: commandRoles,
  listWaitingRoomChairs: readRoles,
  createWaitingRoomChair: chairManagementRoles,
  updateWaitingRoomChair: chairManagementRoles,
} as const satisfies Record<
  keyof WaitingRoomController,
  readonly AuthUserRole[]
>;

type WaitingRoomRouteHandler = keyof typeof routeRoles;

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
  handlerName: WaitingRoomRouteHandler,
  request: {
    user?: JwtPayload;
    params?: {
      clinicId?: string;
    };
  },
): ExecutionContext {
  return {
    getHandler: () => WaitingRoomController.prototype[handlerName],
    getClass: () => WaitingRoomController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function authorizeWaitingRoomRoute(
  handlerName: WaitingRoomRouteHandler,
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

describe(`${WaitingRoomController.name} authorization`, () => {
  it('protects every waiting-room route with JWT, role, and clinic scope guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      WaitingRoomController,
    ) as unknown[];

    expect(guards).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard, ClinicScopeGuard]),
    );

    for (const [handlerName, roles] of Object.entries(routeRoles)) {
      expect(
        Reflect.getMetadata(
          ROLES_KEY,
          WaitingRoomController.prototype[
            handlerName as WaitingRoomRouteHandler
          ],
        ),
      ).toEqual([...roles]);
    }
  });

  it.each(Object.keys(routeRoles) as WaitingRoomRouteHandler[])(
    'rejects missing tokens before %s reaches waiting-room orchestration',
    (handlerName) => {
      expect(() =>
        authorizeWaitingRoomRoute(handlerName, {
          params: { clinicId },
        }),
      ).toThrow(UnauthorizedException);
    },
  );

  it('allows doctors to read waiting-room state but not mutate it', () => {
    expect(
      authorizeWaitingRoomRoute('getWaitingRoomState', {
        user: createUser('doctor', clinicId),
        params: { clinicId },
      }),
    ).toBe(true);

    expect(() =>
      authorizeWaitingRoomRoute('updateWaitingRoomStatus', {
        user: createUser('doctor', clinicId),
        params: { clinicId },
      }),
    ).toThrow(ForbiddenException);
  });

  it('allows secretaries to mutate waiting-room flow and manage chairs', () => {
    expect(
      authorizeWaitingRoomRoute('reorderWaitingRoomEntries', {
        user: createUser('secretary', clinicId),
        params: { clinicId },
      }),
    ).toBe(true);
    expect(
      authorizeWaitingRoomRoute('createWaitingRoomChair', {
        user: createUser('secretary', clinicId),
        params: { clinicId },
      }),
    ).toBe(true);
  });

  it.each(Object.keys(routeRoles) as WaitingRoomRouteHandler[])(
    'rejects users scoped to another clinic before %s reaches orchestration',
    (handlerName) => {
      expect(() =>
        authorizeWaitingRoomRoute(handlerName, {
          user: createUser('admin', otherClinicId),
          params: { clinicId },
        }),
      ).toThrow(ForbiddenException);
    },
  );
});
