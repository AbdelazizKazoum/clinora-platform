import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { JwtPayload } from '../jwt-payload';

@Injectable()
export class ClinicScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      params?: {
        clinicId?: string;
      };
    }>();

    const clinicId = request.params?.clinicId;

    if (!request.user || !clinicId || request.user.clinic_id !== clinicId) {
      throw new ForbiddenException(
        "You do not have access to this clinic's resources",
      );
    }

    return true;
  }
}
