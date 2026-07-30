'use client';

import MainLayout from '@/components/layout/shell/MainLayout';
import { menuItems } from '@/components/layout/shell/components/data';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';
import { filterMenuItemsForRole } from '../model';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, loading, logout, user } = useAuth();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/auth/split/sign-in');
    }
  }, [isAuthReady, isAuthenticated, router]);

  if (!isAuthReady || !isAuthenticated) {
    return null;
  }

  const accessibleMenuItems = filterMenuItemsForRole(menuItems, user?.role);

  return (
    <MainLayout
      isLoggingOut={loading}
      menuItems={accessibleMenuItems}
      onLogout={logout}
    >
      {children}
    </MainLayout>
  );
};

export default RequireAuth;
