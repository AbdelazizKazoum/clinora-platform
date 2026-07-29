import { AUTH_USER_ROLES, type AuthUserRole } from '@clinora/contracts-auth';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { JwtPayload } from '../jwt-payload';

function isAuthUserRole(value: unknown): value is AuthUserRole {
  return (
    typeof value === 'string' && AUTH_USER_ROLES.includes(value as AuthUserRole)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumericDate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: unknown): JwtPayload {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('user_id' in payload) ||
      !isNonEmptyString(payload.user_id) ||
      !('clinic_id' in payload) ||
      !isNonEmptyString(payload.clinic_id) ||
      !('role' in payload) ||
      !isAuthUserRole(payload.role) ||
      !('iat' in payload) ||
      !isNumericDate(payload.iat) ||
      !('exp' in payload) ||
      !isNumericDate(payload.exp)
    ) {
      throw new UnauthorizedException('Invalid authentication token payload');
    }

    return payload as JwtPayload;
  }
}
