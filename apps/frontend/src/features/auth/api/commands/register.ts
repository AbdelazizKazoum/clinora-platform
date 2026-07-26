import { apiClient, setApiAccessToken } from '@/lib/api';
import { mapAuthSessionFromDto } from '../../model/auth.mapper';
import type { RegisterCommand } from '../../model';
import type { AuthResponseDto } from '../dto/auth-response.dto';

export const register = async (command: RegisterCommand) => {
  const response = await apiClient.post<AuthResponseDto>(
    '/auth/register',
    command,
  );
  const session = mapAuthSessionFromDto(response.data);

  setApiAccessToken(session.accessToken);

  return session;
};
