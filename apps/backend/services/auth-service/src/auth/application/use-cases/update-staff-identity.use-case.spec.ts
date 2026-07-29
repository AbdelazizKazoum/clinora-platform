import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import {
  AuthIdentityNotFoundError,
  AuthValidationError,
  EmailAlreadyRegisteredError,
} from '../errors/auth.errors';
import { UpdateStaffIdentityUseCase } from './update-staff-identity.use-case';

describe(UpdateStaffIdentityUseCase.name, () => {
  const existingUser = new User({
    id: '00000000-0000-4000-8000-0000000000a1',
    clinicId: '00000000-0000-4000-8000-000000000001',
    email: 'doctor@clinora.test',
    passwordHash: 'hashed-password',
    fullName: 'Clinic Doctor',
    role: UserRole.Doctor,
    createdAt: new Date('2026-07-26T00:00:00.000Z'),
  });
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

  it('updates identity fields idempotently for the addressed clinic user', async () => {
    users.findByIdAndClinic.mockResolvedValue(existingUser);
    users.findByEmailAndClinic.mockResolvedValue(null);
    users.save.mockImplementation(async (user) => user);

    const useCase = new UpdateStaffIdentityUseCase(users);
    const updatedUser = await useCase.execute({
      userId: existingUser.id,
      clinicId: existingUser.clinicId,
      email: ' Updated@Clinora.test ',
      fullName: ' Updated Doctor ',
      role: UserRole.Admin,
      isActive: false,
    });

    expect(users.findByIdAndClinic).toHaveBeenCalledWith(
      existingUser.id,
      existingUser.clinicId,
    );
    expect(updatedUser).toMatchObject({
      email: 'updated@clinora.test',
      fullName: 'Updated Doctor',
      role: UserRole.Admin,
      isActive: false,
    });
  });

  it('rejects cross-clinic or missing identity targeting as not found', async () => {
    users.findByIdAndClinic.mockResolvedValue(null);

    const useCase = new UpdateStaffIdentityUseCase(users);

    await expect(
      useCase.execute({
        userId: existingUser.id,
        clinicId: '00000000-0000-4000-8000-000000000002',
        isActive: false,
      }),
    ).rejects.toBeInstanceOf(AuthIdentityNotFoundError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate email updates inside the same clinic', async () => {
    users.findByIdAndClinic.mockResolvedValue(existingUser);
    users.findByEmailAndClinic.mockResolvedValue(
      new User({
        id: '00000000-0000-4000-8000-0000000000b2',
        clinicId: existingUser.clinicId,
        email: 'owner@clinora.test',
        passwordHash: 'hashed-password',
        fullName: 'Email Owner',
        role: UserRole.Admin,
        createdAt: new Date('2026-07-26T00:00:00.000Z'),
      }),
    );

    const useCase = new UpdateStaffIdentityUseCase(users);

    await expect(
      useCase.execute({
        userId: existingUser.id,
        clinicId: existingUser.clinicId,
        email: 'owner@clinora.test',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('rejects empty normalized updates as validation failures', async () => {
    users.findByIdAndClinic.mockResolvedValue(existingUser);

    const useCase = new UpdateStaffIdentityUseCase(users);

    await expect(
      useCase.execute({
        userId: existingUser.id,
        clinicId: existingUser.clinicId,
        fullName: '   ',
      }),
    ).rejects.toBeInstanceOf(AuthValidationError);
  });
});
