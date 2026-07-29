import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { InvalidCredentialsError } from '../errors/auth.errors';
import type { JwtServicePort } from '../ports/jwt-service.interface';
import type { PasswordHasher } from '../ports/password-hasher.interface';
import { LoginUserUseCase } from './login-user.use-case';

describe(LoginUserUseCase.name, () => {
  const user = new User({
    id: '00000000-0000-4000-8000-0000000000a1',
    clinicId: '00000000-0000-4000-8000-000000000001',
    email: 'admin@clinora.test',
    passwordHash: 'hashed-password',
    fullName: 'Clinic Admin',
    role: UserRole.Admin,
    createdAt: new Date('2026-07-26T00:00:00.000Z'),
  });
  const users: jest.Mocked<UserRepository> = {
    findByEmailAndClinic: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    updateAvailability: jest.fn(),
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('authenticates a valid user and returns both tokens', async () => {
    users.findByEmailAndClinic.mockResolvedValue(user);
    passwords.compare.mockResolvedValue(true);
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');

    const useCase = new LoginUserUseCase(users, tokens, passwords);
    const result = await useCase.execute({
      email: 'ADMIN@CLINORA.TEST',
      password: 'Secret123!',
      clinicId: user.clinicId,
    });

    expect(users.findByEmailAndClinic).toHaveBeenCalledWith(
      user.email,
      user.clinicId,
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user,
    });
  });

  it('rejects an inactive user with the generic invalid-credentials error', async () => {
    users.findByEmailAndClinic.mockResolvedValue(
      user.changeAvailability(false),
    );
    passwords.compare.mockResolvedValue(true);

    const useCase = new LoginUserUseCase(users, tokens, passwords);
    const result = useCase.execute({
      email: user.email,
      password: 'Secret123!',
      clinicId: user.clinicId,
    });

    await expect(result).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwords.compare).toHaveBeenCalledWith(
      'Secret123!',
      user.passwordHash,
    );
    expect(tokens.signAccessToken).not.toHaveBeenCalled();
    expect(tokens.signRefreshToken).not.toHaveBeenCalled();
  });

  it('uses a password comparison even when the user is absent', async () => {
    users.findByEmailAndClinic.mockResolvedValue(null);
    passwords.compare.mockResolvedValue(false);

    const useCase = new LoginUserUseCase(users, tokens, passwords);
    const result = useCase.execute({
      email: 'missing@clinora.test',
      password: 'wrong-password',
      clinicId: user.clinicId,
    });

    await expect(result).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(passwords.compare).toHaveBeenCalledTimes(1);
    expect(tokens.signAccessToken).not.toHaveBeenCalled();
  });
});
