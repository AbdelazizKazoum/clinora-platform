import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { AuthIdentityNotFoundError } from '../errors/auth.errors';
import { DeleteProvisionedIdentityUseCase } from './delete-provisioned-identity.use-case';

describe(DeleteProvisionedIdentityUseCase.name, () => {
  const users: jest.Mocked<UserRepository> = {
    findByEmailAndClinic: jest.fn(),
    findById: jest.fn(),
    findByIdAndClinic: jest.fn(),
    save: jest.fn(),
    updateAvailability: jest.fn(),
    deleteByIdAndClinic: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deletes a provisioned identity by user and clinic', async () => {
    users.deleteByIdAndClinic.mockResolvedValue(true);

    const useCase = new DeleteProvisionedIdentityUseCase(users);

    await expect(
      useCase.execute({
        userId: '00000000-0000-4000-8000-0000000000a1',
        clinicId: '00000000-0000-4000-8000-000000000001',
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects missing or cross-clinic identities as not found', async () => {
    users.deleteByIdAndClinic.mockResolvedValue(false);

    const useCase = new DeleteProvisionedIdentityUseCase(users);

    await expect(
      useCase.execute({
        userId: '00000000-0000-4000-8000-0000000000a1',
        clinicId: '00000000-0000-4000-8000-000000000002',
      }),
    ).rejects.toBeInstanceOf(AuthIdentityNotFoundError);
  });
});
