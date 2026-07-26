import { apiClient, setApiAccessToken } from '@/lib/api';

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  setApiAccessToken(null);
};
