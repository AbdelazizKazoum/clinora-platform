import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY } from '../../auth.tokens';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { AuthIdentityNotFoundError } from '../errors/auth.errors';

export interface DeleteProvisionedIdentityCommand {
  userId: string;
  clinicId: string;
}

@Injectable()
export class DeleteProvisionedIdentityUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: DeleteProvisionedIdentityCommand): Promise<void> {
    const deleted = await this.users.deleteByIdAndClinic(
      command.userId,
      command.clinicId,
    );

    if (!deleted) {
      throw new AuthIdentityNotFoundError(command.userId);
    }
  }
}
