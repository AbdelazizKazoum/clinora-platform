import { EmailAlreadyRegisteredError } from '../errors/auth.errors';
import type { JwtServicePort } from '../ports/jwt-service.interface';
import type { PasswordHasher } from '../ports/password-hasher.interface';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { RegisterUserUseCase } from './register-user.use-case';

describe(RegisterUserUseCase.name, () => {
  const users: jest.Mocked<UserRepository> = {
    findByEmailAndClinic: jest.fn(),
    findById: jest.fn(),
    findByIdAndClinic: jest.fn(),
    save: jest.fn(),
    updateAvailability: jest.fn(),
    deleteByIdAndClinic: jest.fn(),
  };
  const tokens: jest.Mocked<JwtServicePort> = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  const passwords: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const command = {
    email: ' Admin@Clinora.test ',
    password: 'Secret123!',
    fullName: 'Clinic Admin',
    role: UserRole.Admin,
    clinicId: '00000000-0000-4000-8000-000000000001',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('normalizes the email, hashes the password, and issues tokens', async () => {
    users.findByEmailAndClinic.mockResolvedValue(null);
    users.save.mockImplementation(async (user) => user);
    passwords.hash.mockResolvedValue('hashed-password');
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');

    const useCase = new RegisterUserUseCase(users, tokens, passwords);
    const result = await useCase.execute(command);

    expect(users.findByEmailAndClinic).toHaveBeenCalledWith(
      'admin@clinora.test',
      command.clinicId,
    );
    expect(passwords.hash).toHaveBeenCalledWith(command.password);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@clinora.test',
        passwordHash: 'hashed-password',
        isActive: true,
      }),
    );
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { email: 'admin@clinora.test' },
    });
  });

  it('rejects an email that already exists in the clinic', async () => {
    users.findByEmailAndClinic.mockResolvedValue({
      id: 'existing-user',
    } as never);

    const useCase = new RegisterUserUseCase(users, tokens, passwords);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
    expect(users.save).not.toHaveBeenCalled();
  });
});
