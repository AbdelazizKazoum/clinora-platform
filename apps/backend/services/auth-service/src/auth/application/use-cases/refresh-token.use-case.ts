import { Inject, Injectable } from '@nestjs/common';

import { JWT_SERVICE, USER_REPOSITORY } from '../../auth.tokens';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { InvalidRefreshTokenError } from '../errors/auth.errors';
import type { RefreshTokenResult } from '../models/auth-result';
import type { JwtServicePort } from '../ports/jwt-service.interface';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(JWT_SERVICE)
    private readonly tokens: JwtServicePort,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    let payload: { user_id: string };
    try {
      payload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(payload.user_id);
    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenError();
    }

    const [accessToken, rotatedRefreshToken] = await Promise.all([
      this.tokens.signAccessToken({
        user_id: user.id,
        clinic_id: user.clinicId,
        role: user.role,
      }),
      this.tokens.signRefreshToken({ user_id: user.id }),
    ]);

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
    };
  }
}
