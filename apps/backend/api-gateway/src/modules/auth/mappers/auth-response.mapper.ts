import type { AuthReply, UserProfile } from '@clinora/contracts-auth';

export interface AuthHttpResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export class AuthResponseMapper {
  static toHttp(reply: AuthReply): AuthHttpResponse {
    return {
      accessToken: reply.accessToken,
      refreshToken: reply.refreshToken,
      user: reply.user,
    };
  }
}
