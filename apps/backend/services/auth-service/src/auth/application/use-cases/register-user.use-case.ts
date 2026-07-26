import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import {
  JWT_SERVICE,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../../auth.tokens';
import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { EmailAlreadyRegisteredError } from '../errors/auth.errors';
import type { AuthResult } from '../models/auth-result';
import type { JwtServicePort } from '../ports/jwt-service.interface';
import type { PasswordHasher } from '../ports/password-hasher.interface';

export interface RegisterUserCommand {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  clinicId: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(JWT_SERVICE)
    private readonly tokens: JwtServicePort,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthResult> {
    const email = command.email.trim().toLowerCase();
    const existingUser = await this.users.findByEmailAndClinic(
      email,
      command.clinicId,
    );

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = new User({
      id: randomUUID(),
      clinicId: command.clinicId,
      email,
      passwordHash: await this.passwords.hash(command.password),
      fullName: command.fullName.trim(),
      role: command.role,
      createdAt: new Date(),
    });
    const savedUser = await this.users.save(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken({
        user_id: savedUser.id,
        clinic_id: savedUser.clinicId,
        role: savedUser.role,
      }),
      this.tokens.signRefreshToken({ user_id: savedUser.id }),
    ]);

    return { accessToken, refreshToken, user: savedUser };
  }
}
