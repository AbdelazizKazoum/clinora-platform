import type {
  AuthReply,
  LoginRequest,
  RefreshTokenReply,
  RefreshTokenRequest,
  RegisterRequest,
} from '@clinora/contracts-auth';

export const AUTH_SERVICE_CLIENT = Symbol('AUTH_SERVICE_CLIENT');
export const AUTH_GRPC_CLIENT = Symbol('AUTH_GRPC_CLIENT');

export interface AuthServiceClient {
  login(request: LoginRequest): Promise<AuthReply>;
  register(request: RegisterRequest): Promise<AuthReply>;
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenReply>;
}
