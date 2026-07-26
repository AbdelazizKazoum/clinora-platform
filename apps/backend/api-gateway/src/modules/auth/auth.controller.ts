import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthFacade } from './auth.facade';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthResponseMapper,
  type AuthHttpResponse,
} from './mappers/auth-response.mapper';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthFacade,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthHttpResponse> {
    const result = await this.auth.login(input);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return AuthResponseMapper.toHttp(result);
  }

  @Post('register')
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthHttpResponse> {
    const result = await this.auth.register(input);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return AuthResponseMapper.toHttp(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() input: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken =
      input.refreshToken ??
      (request.cookies as Record<string, string> | undefined)?.[
        'refresh_token'
      ];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.auth.refresh(refreshToken);
    this.setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
    );
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Res({ passthrough: true }) response: Response,
  ): { message: string } {
    const secure = this.config.getOrThrow<boolean>('COOKIE_SECURE');
    response.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure,
    });
    response.clearCookie('refresh_token', {
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      sameSite: 'strict',
      secure,
    });
    return { message: 'Logged out' };
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = this.config.getOrThrow<boolean>('COOKIE_SECURE');
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      path: '/',
      sameSite: 'strict',
      secure,
    });
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      path: REFRESH_COOKIE_PATH,
      sameSite: 'strict',
      secure,
    });
  }
}
