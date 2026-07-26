import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import type {
  AuthReply,
  AuthServiceClient as GrpcAuthServiceContractClient,
  LoginRequest,
  RefreshTokenReply,
  RefreshTokenRequest,
  RegisterRequest,
} from '@clinora/contracts-auth';
import { AUTH_SERVICE_NAME } from '@clinora/contracts-auth';

import {
  AUTH_GRPC_CLIENT,
  type AuthServiceClient,
} from './auth-service.client';

@Injectable()
export class GrpcAuthServiceClient
  implements AuthServiceClient, OnModuleInit
{
  private service?: GrpcAuthServiceContractClient;

  constructor(
    @Inject(AUTH_GRPC_CLIENT)
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.service =
      this.grpcClient.getService<GrpcAuthServiceContractClient>(
        AUTH_SERVICE_NAME,
      );
  }

  login(request: LoginRequest): Promise<AuthReply> {
    return lastValueFrom(this.getService().login(request));
  }

  register(request: RegisterRequest): Promise<AuthReply> {
    return lastValueFrom(this.getService().register(request));
  }

  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenReply> {
    return lastValueFrom(this.getService().refreshToken(request));
  }

  private getService(): GrpcAuthServiceContractClient {
    if (!this.service) {
      throw new Error('Auth gRPC client has not been initialized');
    }
    return this.service;
  }
}
