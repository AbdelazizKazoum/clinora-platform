export interface AccessTokenPayload {
  user_id: string;
  clinic_id: string;
  role: string;
}

export interface JwtServicePort {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  signRefreshToken(payload: { user_id: string }): Promise<string>;
  verifyRefreshToken(token: string): Promise<{ user_id: string }>;
}
