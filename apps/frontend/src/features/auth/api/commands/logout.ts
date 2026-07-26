import { signOut } from 'next-auth/react';

export const logout = async (): Promise<void> => {
  await signOut({ redirect: false });
};
