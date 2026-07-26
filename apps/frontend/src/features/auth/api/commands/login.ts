import { ApiError } from '@/lib/api';
import { signIn } from 'next-auth/react';
import type { LoginCommand } from '../../model';

export const login = async (command: LoginCommand): Promise<void> => {
  const result = await signIn('credentials', {
    ...command,
    redirect: false,
  });

  if (!result || result.error) {
    throw new ApiError('Invalid email, password, or clinic', 401);
  }
};
