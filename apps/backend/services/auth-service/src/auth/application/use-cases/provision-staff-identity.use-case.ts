import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { PASSWORD_HASHER, USER_REPOSITORY } from '../../auth.tokens';
import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import {
  AuthValidationError,
  EmailAlreadyRegisteredError,
} from '../errors/auth.errors';
import type { PasswordHasher } from '../ports/password-hasher.interface';

export interface ProvisionStaffIdentityCommand {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  clinicId: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeFullName(fullName: string): string {
  return fullName.trim();
}

@Injectable()
export class ProvisionStaffIdentityUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(command: ProvisionStaffIdentityCommand): Promise<User> {
    const email = normalizeEmail(command.email);
    const fullName = normalizeFullName(command.fullName);

    if (!email || !fullName) {
      throw new AuthValidationError('Email and full name are required');
    }

    const existingUser = await this.users.findByEmailAndClinic(
      email,
      command.clinicId,
    );

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    return this.users.save(
      new User({
        id: randomUUID(),
        clinicId: command.clinicId,
        email,
        passwordHash: await this.passwords.hash(command.password),
        fullName,
        role: command.role,
        isActive: true,
        createdAt: new Date(),
      }),
    );
  }
}
