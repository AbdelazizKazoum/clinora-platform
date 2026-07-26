import { Module } from '@nestjs/common';

import { AuthClientModule } from '../../clients/auth/auth-client.module';
import { AuthController } from './auth.controller';
import { AuthFacade } from './auth.facade';

@Module({
  imports: [AuthClientModule],
  controllers: [AuthController],
  providers: [AuthFacade],
})
export class AuthModule {}
