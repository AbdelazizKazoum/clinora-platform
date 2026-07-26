'use client';
import { API_ACCESS_TOKEN_STORAGE_KEY } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login as loginCommand, logout as logoutCommand } from '../api';

const DEFAULT_CLINIC_ID = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID;

export const useAuth = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(window.sessionStorage.getItem(API_ACCESS_TOKEN_STORAGE_KEY));
    setIsAuthReady(true);
  }, []);

  const login = async (
    email: string,
    password: string,
    clinicId = DEFAULT_CLINIC_ID,
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!clinicId) {
        throw new Error('Clinic context is required to sign in');
      }

      const result = await loginCommand({ email, password, clinicId });
      setToken(result.accessToken);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutCommand();
    setToken(null);
    router.replace('/auth/split/sign-in');
  };

  const isAuthenticated = token;

  return {
    login,
    logout,
    isAuthenticated,
    isAuthReady,
    loading,
    error,
  };
};
