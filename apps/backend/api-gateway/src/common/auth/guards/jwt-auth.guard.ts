import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { JwtPayload } from '../jwt-payload';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<T = JwtPayload>(
    err: Error | null,
    user: T | false | null,
  ): T {
    if (err || !user) {
      throw new UnauthorizedException(
        'Invalid or missing authentication token',
      );
    }

    return user;
  }
}
