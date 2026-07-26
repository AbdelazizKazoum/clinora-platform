import { apiClient, setApiAccessToken } from '@/lib/api';
import { mapAuthSessionFromDto } from '../../model/auth.mapper';
import type { LoginCommand } from '../../model';
import type { AuthResponseDto } from '../dto/auth-response.dto';

export const login = async (command: LoginCommand) => {
  const response = await apiClient.post<AuthResponseDto>(
    '/auth/login',
    command,
  );
  const session = mapAuthSessionFromDto(response.data);

  setApiAccessToken(session.accessToken);

  return session;
};
