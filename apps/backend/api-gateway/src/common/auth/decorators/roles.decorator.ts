import type { AuthUserRole } from '@clinora/contracts-auth';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AuthUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
