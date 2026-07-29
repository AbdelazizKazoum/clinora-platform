import type {
  AuthReply,
  RefreshTokenReply,
  UserProfile,
} from '@clinora/contracts-auth';

import type {
  AuthResult,
  RefreshTokenResult,
} from '../../application/models/auth-result';

export class AuthGrpcMapper {
  static toUserProfile(user: AuthResult['user']): UserProfile {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
    };
  }

  static toAuthReply(result: AuthResult): AuthReply {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: AuthGrpcMapper.toUserProfile(result.user),
    };
  }

  static toRefreshTokenReply(
    result: RefreshTokenResult,
  ): RefreshTokenReply {
    return result;
  }
}
