import 'server-only';

import { buildGatewayUrl } from '@/lib/api/server/gateway-url';
import { readJwtExpiration } from '@/lib/auth/auth-session';
import axios from 'axios';
import type { LoginCommand, RegisterCommand } from '../../model';
import type { AuthResponseDto } from '../dto/auth-response.dto';

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const readCookie = (
  setCookies: string[] | undefined,
  name: string,
): string | null => {
  const prefix = `${name}=`;
  const cookie = setCookies?.find((value) => value.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length).split(';', 1)[0]);
};

export const authenticateAtGateway = async (
  command: LoginCommand,
): Promise<AuthResponseDto> => {
  const response = await axios.post<AuthResponseDto>(
    buildGatewayUrl('auth/login'),
    command,
    { headers: JSON_HEADERS },
  );

  return response.data;
};

export const registerAtGateway = async (
  command: RegisterCommand,
): Promise<AuthResponseDto> => {
  const response = await axios.post<AuthResponseDto>(
    buildGatewayUrl('auth/register'),
    command,
    { headers: JSON_HEADERS },
  );

  return response.data;
};

export const refreshGatewaySession = async (
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
}> => {
  const response = await axios.post<{ accessToken: string }>(
    buildGatewayUrl('auth/refresh'),
    { refreshToken },
    { headers: JSON_HEADERS },
  );
  const rotatedRefreshToken =
    readCookie(response.headers['set-cookie'], 'refresh_token') ?? refreshToken;

  return {
    accessToken: response.data.accessToken,
    refreshToken: rotatedRefreshToken,
    accessTokenExpiresAt: readJwtExpiration(response.data.accessToken),
  };
};
