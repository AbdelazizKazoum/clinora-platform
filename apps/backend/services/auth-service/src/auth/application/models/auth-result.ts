import { User } from '../../domain/entities/user';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}
