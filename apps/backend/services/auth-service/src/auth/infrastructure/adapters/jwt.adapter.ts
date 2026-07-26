import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type {
  AccessTokenPayload,
  JwtServicePort,
} from '../../application/ports/jwt-service.interface';
import { REFRESH_JWT_SERVICE } from '../../auth.tokens';

@Injectable()
export class JwtAdapter implements JwtServicePort {
  constructor(
    private readonly accessTokens: JwtService,
    @Inject(REFRESH_JWT_SERVICE)
    private readonly refreshTokens: JwtService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.accessTokens.signAsync(payload);
  }

  signRefreshToken(payload: { user_id: string }): Promise<string> {
    return this.refreshTokens.signAsync(payload);
  }

  verifyRefreshToken(token: string): Promise<{ user_id: string }> {
    return this.refreshTokens.verifyAsync<{ user_id: string }>(token);
  }
}
