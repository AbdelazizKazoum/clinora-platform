import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { AUTH_SERVICE_NAME } from '@clinora/contracts-auth';

import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../application/errors/auth.errors';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { AuthGrpcMapper } from './auth.grpc-mapper';
import {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from './auth.grpc-inputs';

@Controller()
export class AuthGrpcController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly registerUser: RegisterUserUseCase,
    private readonly refreshTokens: RefreshTokenUseCase,
  ) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  async login(input: LoginInput) {
    try {
      const result = await this.loginUser.execute({
        email: input.email,
        password: input.password,
        clinicId: input.clinicId,
      });
      return AuthGrpcMapper.toAuthReply(result);
    } catch (error: unknown) {
      this.throwRpcError(error);
    }
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'Register')
  async register(input: RegisterInput) {
    try {
      const result = await this.registerUser.execute(input);
      return AuthGrpcMapper.toAuthReply(result);
    } catch (error: unknown) {
      this.throwRpcError(error);
    }
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'RefreshToken')
  async refreshToken(input: RefreshTokenInput) {
    try {
      const result = await this.refreshTokens.execute(input.refreshToken);
      return AuthGrpcMapper.toRefreshTokenReply(result);
    } catch (error: unknown) {
      this.throwRpcError(error);
    }
  }

  private throwRpcError(error: unknown): never {
    if (error instanceof EmailAlreadyRegisteredError) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: error.message,
      });
    }
    if (
      error instanceof InvalidCredentialsError ||
      error instanceof InvalidRefreshTokenError
    ) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: error.message,
      });
    }
    throw new RpcException({
      code: status.INTERNAL,
      message: 'Internal authentication error',
    });
  }
}
