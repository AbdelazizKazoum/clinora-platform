import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { InvalidRefreshTokenError } from '../errors/auth.errors';
import type { JwtServicePort } from '../ports/jwt-service.interface';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe(RefreshTokenUseCase.name, () => {
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rotates refresh tokens for an active user', async () => {
    tokens.verifyRefreshToken.mockResolvedValue({ user_id: user.id });
    users.findById.mockResolvedValue(user);
    tokens.signAccessToken.mockResolvedValue('new-access-token');
    tokens.signRefreshToken.mockResolvedValue('new-refresh-token');

    const useCase = new RefreshTokenUseCase(users, tokens);
    const result = await useCase.execute('refresh-token');

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(tokens.signAccessToken).toHaveBeenCalledWith({
      user_id: user.id,
      clinic_id: user.clinicId,
      role: user.role,
    });
  });

  it('rejects refresh for an inactive user with the generic refresh-token error', async () => {
    tokens.verifyRefreshToken.mockResolvedValue({ user_id: user.id });
    users.findById.mockResolvedValue(user.changeAvailability(false));

    const useCase = new RefreshTokenUseCase(users, tokens);

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(tokens.signAccessToken).not.toHaveBeenCalled();
    expect(tokens.signRefreshToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid refresh token without issuing new tokens', async () => {
    tokens.verifyRefreshToken.mockRejectedValue(new Error('expired'));

    const useCase = new RefreshTokenUseCase(users, tokens);

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(users.findById).not.toHaveBeenCalled();
    expect(tokens.signAccessToken).not.toHaveBeenCalled();
    expect(tokens.signRefreshToken).not.toHaveBeenCalled();
  });
});
