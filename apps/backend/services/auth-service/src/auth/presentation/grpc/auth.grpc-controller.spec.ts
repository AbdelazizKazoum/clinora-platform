import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import {
  AuthIdentityNotFoundError,
  AuthValidationError,
  EmailAlreadyRegisteredError,
} from '../../application/errors/auth.errors';
import type { DeleteProvisionedIdentityUseCase } from '../../application/use-cases/delete-provisioned-identity.use-case';
import type { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import type { ProvisionStaffIdentityUseCase } from '../../application/use-cases/provision-staff-identity.use-case';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import type { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import type { UpdateStaffIdentityUseCase } from '../../application/use-cases/update-staff-identity.use-case';
import { AuthGrpcController } from './auth.grpc-controller';

const user = new User({
  id: '00000000-0000-4000-8000-0000000000a1',
  clinicId: '00000000-0000-4000-8000-000000000001',
  email: 'doctor@clinora.test',
  passwordHash: 'hashed-password',
  fullName: 'Clinic Doctor',
  role: UserRole.Doctor,
  createdAt: new Date('2026-07-26T00:00:00.000Z'),
});

async function expectRpcCode(
  promise: Promise<unknown>,
  expectedCode: status,
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected RpcException');
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(RpcException);
    expect((error as RpcException).getError()).toMatchObject({
      code: expectedCode,
    });
  }
}

describe(AuthGrpcController.name, () => {
  const loginUser = { execute: jest.fn() } as unknown as LoginUserUseCase;
  const registerUser = { execute: jest.fn() } as unknown as RegisterUserUseCase;
  const refreshTokens = {
    execute: jest.fn(),
  } as unknown as RefreshTokenUseCase;
  const provisionStaffIdentity = {
    execute: jest.fn(),
  } as unknown as ProvisionStaffIdentityUseCase;
  const updateStaffIdentity = {
    execute: jest.fn(),
  } as unknown as UpdateStaffIdentityUseCase;
  const deleteProvisionedIdentity = {
    execute: jest.fn(),
  } as unknown as DeleteProvisionedIdentityUseCase;

  let controller: AuthGrpcController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AuthGrpcController(
      loginUser,
      registerUser,
      refreshTokens,
      provisionStaffIdentity,
      updateStaffIdentity,
      deleteProvisionedIdentity,
    );
  });

  it('returns a token-free profile when provisioning a staff identity', async () => {
    jest.mocked(provisionStaffIdentity.execute).mockResolvedValue(user);

    await expect(
      controller.provisionStaff({
        email: 'doctor@clinora.test',
        password: 'StrongPassword123!',
        fullName: 'Clinic Doctor',
        role: UserRole.Doctor,
        clinicId: user.clinicId,
      }),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
    });
  });

  it('maps duplicate email failures to ALREADY_EXISTS', async () => {
    jest
      .mocked(provisionStaffIdentity.execute)
      .mockRejectedValue(new EmailAlreadyRegisteredError());

    await expectRpcCode(
      controller.provisionStaff({
        email: 'doctor@clinora.test',
        password: 'StrongPassword123!',
        fullName: 'Clinic Doctor',
        role: UserRole.Doctor,
        clinicId: user.clinicId,
      }),
      status.ALREADY_EXISTS,
    );
  });

  it('maps missing identity failures to NOT_FOUND', async () => {
    jest
      .mocked(updateStaffIdentity.execute)
      .mockRejectedValue(new AuthIdentityNotFoundError(user.id));

    await expectRpcCode(
      controller.updateStaff({
        userId: user.id,
        clinicId: user.clinicId,
        isActive: false,
      }),
      status.NOT_FOUND,
    );
  });

  it('maps validation failures to INVALID_ARGUMENT', async () => {
    jest
      .mocked(updateStaffIdentity.execute)
      .mockRejectedValue(new AuthValidationError('Email cannot be empty'));

    await expectRpcCode(
      controller.updateStaff({
        userId: user.id,
        clinicId: user.clinicId,
        email: '',
      }),
      status.INVALID_ARGUMENT,
    );
  });

  it('returns a delete acknowledgement for provisioned identity compensation', async () => {
    jest.mocked(deleteProvisionedIdentity.execute).mockResolvedValue(undefined);

    await expect(
      controller.deleteProvisioned({
        userId: user.id,
        clinicId: user.clinicId,
      }),
    ).resolves.toEqual({ deleted: true });
  });
});
