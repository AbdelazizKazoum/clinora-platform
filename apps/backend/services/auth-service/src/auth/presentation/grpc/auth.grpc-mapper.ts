import type {
  AuthReply,
  RefreshTokenReply,
} from '@clinora/contracts-auth';

import type {
  AuthResult,
  RefreshTokenResult,
} from '../../application/models/auth-result';

export class AuthGrpcMapper {
  static toAuthReply(result: AuthResult): AuthReply {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        clinicId: result.user.clinicId,
      },
    };
  }

  static toRefreshTokenReply(
    result: RefreshTokenResult,
  ): RefreshTokenReply {
    return result;
  }
}
