import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { UserRole } from '../../domain/enums/user-role.enum';
import {
  AuthValidationError,
  EmailAlreadyRegisteredError,
} from '../errors/auth.errors';
import type { PasswordHasher } from '../ports/password-hasher.interface';
import { ProvisionStaffIdentityUseCase } from './provision-staff-identity.use-case';

describe(ProvisionStaffIdentityUseCase.name, () => {
  const users: jest.Mocked<UserRepository> = {
    findByEmailAndClinic: jest.fn(),
    findById: jest.fn(),
    findByIdAndClinic: jest.fn(),
    save: jest.fn(),
    updateAvailability: jest.fn(),
    deleteByIdAndClinic: jest.fn(),
  };
  const passwords: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const command = {
    email: ' Doctor@Clinora.test ',
    password: 'StrongPassword123!',
    fullName: ' Clinic Doctor ',
    role: UserRole.Doctor,
    clinicId: '00000000-0000-4000-8000-000000000001',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an active staff identity without issuing login tokens', async () => {
    users.findByEmailAndClinic.mockResolvedValue(null);
    users.save.mockImplementation(async (user) => user);
    passwords.hash.mockResolvedValue('hashed-password');

    const useCase = new ProvisionStaffIdentityUseCase(users, passwords);
    const user = await useCase.execute(command);

    expect(users.findByEmailAndClinic).toHaveBeenCalledWith(
      'doctor@clinora.test',
      command.clinicId,
    );
    expect(passwords.hash).toHaveBeenCalledWith(command.password);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'doctor@clinora.test',
        fullName: 'Clinic Doctor',
        isActive: true,
      }),
    );
    expect(user.email).toBe('doctor@clinora.test');
  });

  it('rejects duplicate clinic email addresses', async () => {
    users.findByEmailAndClinic.mockResolvedValue({ id: 'existing' } as never);

    const useCase = new ProvisionStaffIdentityUseCase(users, passwords);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  it('rejects empty normalized names as validation failures', async () => {
    const useCase = new ProvisionStaffIdentityUseCase(users, passwords);

    await expect(
      useCase.execute({ ...command, fullName: '   ' }),
    ).rejects.toBeInstanceOf(AuthValidationError);
    expect(users.save).not.toHaveBeenCalled();
  });
});
