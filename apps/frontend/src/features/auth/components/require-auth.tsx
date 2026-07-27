'use client';

import MainLayout from '@/components/layout/shell/MainLayout';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, loading, logout } = useAuth();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/auth/split/sign-in');
    }
  }, [isAuthReady, isAuthenticated, router]);

  if (!isAuthReady || !isAuthenticated) {
    return null;
  }

  return (
    <MainLayout isLoggingOut={loading} onLogout={logout}>
      {children}
    </MainLayout>
  );
};

export default RequireAuth;
