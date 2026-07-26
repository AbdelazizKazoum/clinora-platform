import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UserTypeOrmEntity } from './auth/infrastructure/persistence/entities/user.typeorm-entity';
import { CreateUsersTable20260726000000 } from './auth/infrastructure/persistence/migrations/20260726000000-create-users-table';
import { validateAuthEnvironment } from './configuration/auth-environment';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateAuthEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [UserTypeOrmEntity],
        migrations: [CreateUsersTable20260726000000],
        migrationsRun: config.getOrThrow<boolean>('DB_MIGRATIONS_RUN'),
        synchronize: false,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
