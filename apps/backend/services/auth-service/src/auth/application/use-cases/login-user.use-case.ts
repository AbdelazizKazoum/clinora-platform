import { Inject, Injectable } from '@nestjs/common';

import {
  JWT_SERVICE,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../../auth.tokens';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { InvalidCredentialsError } from '../errors/auth.errors';
import type { AuthResult } from '../models/auth-result';
import type { JwtServicePort } from '../ports/jwt-service.interface';
import type { PasswordHasher } from '../ports/password-hasher.interface';

export interface LoginUserCommand {
  email: string;
  password: string;
  clinicId: string;
}

const DUMMY_PASSWORD_HASH =
  '$2a$12$Yoh6i6w1F0a27lxKrZIizeBFaAr0c1HPaW3J7Tl9kTGIV7Gl2lv52';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(JWT_SERVICE)
    private readonly tokens: JwtServicePort,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(command: LoginUserCommand): Promise<AuthResult> {
    const email = command.email.trim().toLowerCase();
    const user = await this.users.findByEmailAndClinic(
      email,
      command.clinicId,
    );

    if (!user) {
      await this.passwords.compare(command.password, DUMMY_PASSWORD_HASH);
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwords.compare(
      command.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InvalidCredentialsError();
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken({
        user_id: user.id,
        clinic_id: user.clinicId,
        role: user.role,
      }),
      this.tokens.signRefreshToken({ user_id: user.id }),
    ]);

    return { accessToken, refreshToken, user };
  }
}
