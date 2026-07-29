import { status } from '@grpc/grpc-js';
import type { ClientGrpc } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

import type { AuthServiceClient, UserProfile } from '@clinora/contracts-auth';

import {
  ClinicDependencyError,
  ClinicRecordConflictError,
  ClinicRecordNotFoundError,
  ClinicValidationError,
} from '../../../application/errors/clinic.errors';
import { StaffRole } from '../../../domain/enums/staff-role.enum';
import { GrpcAuthServiceAdapter } from './grpc-auth-service.adapter';

const clinicId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-0000000000a1';

function createProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: userId,
    clinicId,
    email: 'doctor@clinora.test',
    fullName: 'Clinic Doctor',
    role: 'doctor',
    ...overrides,
  };
}

function createService(
  overrides: Partial<Record<keyof AuthServiceClient, jest.Mock>> = {},
): jest.Mocked<AuthServiceClient> {
  return {
    login: jest.fn(),
    register: jest.fn().mockReturnValue(
      of({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: createProfile(),
      }),
    ),
    refreshToken: jest.fn(),
    provisionStaffIdentity: jest.fn().mockReturnValue(of(createProfile())),
    updateStaffIdentity: jest.fn().mockReturnValue(of(createProfile())),
    deleteProvisionedIdentity: jest
      .fn()
      .mockReturnValue(of({ deleted: true })),
    ...overrides,
  } as jest.Mocked<AuthServiceClient>;
}

function createAdapter(service: AuthServiceClient): GrpcAuthServiceAdapter {
  const grpcClient = {
    getService: jest.fn().mockReturnValue(service),
  } as unknown as ClientGrpc;
  const adapter = new GrpcAuthServiceAdapter(grpcClient);
  adapter.onModuleInit();
  return adapter;
}

describe(GrpcAuthServiceAdapter.name, () => {
  it.each([
    [StaffRole.Secretary, 'secretary'],
    [StaffRole.DentalAssistant, 'dental_assistant'],
    [StaffRole.Doctor, 'doctor'],
    [StaffRole.Admin, 'admin'],
  ])('maps %s to the auth %s role', async (staffRole, authRole) => {
    const service = createService();
    const adapter = createAdapter(service);

    await adapter.provisionStaffIdentity({
      clinicId,
      email: 'staff@clinora.test',
      password: 'StrongPassword123!',
      fullName: 'Clinic Staff',
      role: staffRole,
    });

    expect(service.provisionStaffIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ role: authRole }),
    );
  });

  it('keeps legacy staff registration mapped through the auth register RPC', async () => {
    const service = createService();
    const adapter = createAdapter(service);

    const identity = await adapter.registerStaff({
      clinicId,
      email: 'assistant@example.ma',
      password: 'StrongPassword123!',
      fullName: 'Nadia Alaoui',
      role: StaffRole.DentalAssistant,
    });

    expect(service.register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'dental_assistant' }),
    );
    expect(identity).toEqual({ id: userId });
  });

  it('provisions a staff identity without exposing auth tokens to the clinic port', async () => {
    const service = createService();
    const adapter = createAdapter(service);

    await expect(
      adapter.provisionStaffIdentity({
        clinicId,
        email: 'doctor@clinora.test',
        password: 'StrongPassword123!',
        fullName: 'Clinic Doctor',
        role: StaffRole.Doctor,
      }),
    ).resolves.toEqual({ id: userId });
  });

  it('updates a staff identity through auth-owned fields only', async () => {
    const service = createService();
    const adapter = createAdapter(service);

    await expect(
      adapter.updateStaffIdentity({
        userId,
        clinicId,
        email: 'updated@clinora.test',
        fullName: 'Updated Doctor',
        role: StaffRole.Admin,
        isActive: false,
      }),
    ).resolves.toEqual({ id: userId });

    expect(service.updateStaffIdentity).toHaveBeenCalledWith({
      userId,
      clinicId,
      email: 'updated@clinora.test',
      fullName: 'Updated Doctor',
      role: 'admin',
      isActive: false,
    });
  });

  it('deletes a provisioned identity for compensation', async () => {
    const service = createService();
    const adapter = createAdapter(service);

    await expect(
      adapter.deleteProvisionedIdentity({ userId, clinicId }),
    ).resolves.toBeUndefined();
    expect(service.deleteProvisionedIdentity).toHaveBeenCalledWith({
      userId,
      clinicId,
    });
  });

  it.each([
    [
      status.ALREADY_EXISTS,
      ClinicRecordConflictError,
      'Email already registered',
    ],
    [
      status.INVALID_ARGUMENT,
      ClinicValidationError,
      'Invalid identity input',
    ],
    [status.NOT_FOUND, ClinicRecordNotFoundError, 'Auth identity missing'],
    [status.UNAVAILABLE, ClinicDependencyError, 'Auth service unavailable'],
  ])(
    'maps auth gRPC status %s to %p',
    async (grpcStatus, expectedError, details) => {
      const service = createService({
        updateStaffIdentity: jest
          .fn()
          .mockReturnValue(throwError(() => ({ code: grpcStatus, details }))),
      });
      const adapter = createAdapter(service);

      await expect(
        adapter.updateStaffIdentity({ userId, clinicId, isActive: false }),
      ).rejects.toBeInstanceOf(expectedError);
    },
  );

  it('maps an uninitialized gRPC service as a clinic dependency failure', async () => {
    const adapter = new GrpcAuthServiceAdapter({
      getService: jest.fn(),
    } as unknown as ClientGrpc);

    await expect(
      adapter.provisionStaffIdentity({
        clinicId,
        email: 'doctor@clinora.test',
        password: 'StrongPassword123!',
        fullName: 'Clinic Doctor',
        role: StaffRole.Doctor,
      }),
    ).rejects.toBeInstanceOf(ClinicDependencyError);
  });
});
