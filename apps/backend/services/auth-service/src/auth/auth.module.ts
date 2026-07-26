import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import {
  JWT_SERVICE,
  PASSWORD_HASHER,
  REFRESH_JWT_SERVICE,
  USER_REPOSITORY,
} from './auth.tokens';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password-hasher';
import { JwtAdapter } from './infrastructure/adapters/jwt.adapter';
import { UserTypeOrmEntity } from './infrastructure/persistence/entities/user.typeorm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/repositories/typeorm-user.repository';
import { AuthGrpcController } from './presentation/grpc/auth.grpc-controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeOrmEntity])],
  controllers: [AuthGrpcController],
  providers: [
    LoginUserUseCase,
    RegisterUserUseCase,
    RefreshTokenUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: REFRESH_JWT_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
          signOptions: {
            expiresIn: config.getOrThrow<number>(
              'REFRESH_TOKEN_EXPIRES_IN',
            ),
          },
        }),
    },
    {
      provide: JWT_SERVICE,
      useClass: JwtAdapter,
    },
  ],
})
export class AuthModule {}
