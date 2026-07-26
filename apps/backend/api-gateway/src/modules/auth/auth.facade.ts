import { Inject, Injectable } from '@nestjs/common';

import type {
  AuthReply,
  RefreshTokenReply,
} from '@clinora/contracts-auth';

import {
  AUTH_SERVICE_CLIENT,
  type AuthServiceClient,
} from '../../clients/auth/auth-service.client';
import { mapGrpcException } from '../../common/errors/grpc-exception.mapper';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthFacade {
  constructor(
    @Inject(AUTH_SERVICE_CLIENT)
    private readonly authClient: AuthServiceClient,
  ) {}

  async login(input: LoginDto): Promise<AuthReply> {
    try {
      return await this.authClient.login({
        email: input.email,
        password: input.password,
        clinicId: input.clinicId,
      });
    } catch (error: unknown) {
      throw mapGrpcException(error);
    }
  }

  async register(input: RegisterDto): Promise<AuthReply> {
    try {
      return await this.authClient.register({
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        role: input.role,
        clinicId: input.clinicId,
      });
    } catch (error: unknown) {
      throw mapGrpcException(error);
    }
  }

  async refresh(refreshToken: string): Promise<RefreshTokenReply> {
    try {
      return await this.authClient.refreshToken({ refreshToken });
    } catch (error: unknown) {
      throw mapGrpcException(error);
    }
  }
}
