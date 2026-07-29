import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import type { JwtPayload } from '../jwt-payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Invalid or missing authentication token',
      );
    }

    return request.user;
  },
);
