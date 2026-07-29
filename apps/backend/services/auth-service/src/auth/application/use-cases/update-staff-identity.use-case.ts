import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY } from '../../auth.tokens';
import type { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import {
  AuthIdentityNotFoundError,
  AuthValidationError,
  EmailAlreadyRegisteredError,
} from '../errors/auth.errors';

export interface UpdateStaffIdentityCommand {
  userId: string;
  clinicId: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

function normalizeOptionalEmail(email: string | undefined): string | undefined {
  return email === undefined ? undefined : email.trim().toLowerCase();
}

function normalizeOptionalFullName(
  fullName: string | undefined,
): string | undefined {
  return fullName === undefined ? undefined : fullName.trim();
}

@Injectable()
export class UpdateStaffIdentityUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: UpdateStaffIdentityCommand): Promise<User> {
    const existingUser = await this.users.findByIdAndClinic(
      command.userId,
      command.clinicId,
    );

    if (!existingUser) {
      throw new AuthIdentityNotFoundError(command.userId);
    }

    const email = normalizeOptionalEmail(command.email);
    const fullName = normalizeOptionalFullName(command.fullName);

    if (email === '' || fullName === '') {
      throw new AuthValidationError('Email and full name cannot be empty');
    }

    if (email && email !== existingUser.email) {
      const emailOwner = await this.users.findByEmailAndClinic(
        email,
        command.clinicId,
      );

      if (emailOwner && emailOwner.id !== existingUser.id) {
        throw new EmailAlreadyRegisteredError();
      }
    }

    return this.users.save(
      existingUser.updateIdentity({
        email,
        fullName,
        role: command.role,
        isActive: command.isActive,
      }),
    );
  }
}
