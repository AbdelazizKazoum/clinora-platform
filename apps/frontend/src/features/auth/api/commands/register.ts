import { ApiError } from '@/lib/api';
import axios from 'axios';
import type { AuthUser, RegisterCommand } from '../../model';
import { login } from './login';

export const register = async (
  command: RegisterCommand,
): Promise<AuthUser> => {
  try {
    const response = await axios.post<AuthUser>('/api/auth/register', command);
    await login(command);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : (error.response?.data?.message ?? error.message);

      throw new ApiError(message, error.response?.status, error.response?.data);
    }

    throw error;
  }
};
