'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  login as loginCommand,
  logout as logoutCommand,
  register as registerCommand,
} from '../api';
import type { AuthUserRole } from '../model';

const DEFAULT_CLINIC_ID = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID;

export const useAuth = () => {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      await loginCommand({ email, password, clinicId });
      await update();
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutCommand();
      router.replace('/auth/split/sign-in');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign out');
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: AuthUserRole = 'admin',
    clinicId = DEFAULT_CLINIC_ID,
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!clinicId) {
        throw new Error('Clinic context is required to create an account');
      }

      await registerCommand({
        clinicId,
        email,
        fullName,
        password,
        role,
      });
      await update();
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create the account',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    user: session?.user ?? null,
    login,
    logout,
    register,
    isAuthenticated:
      status === 'authenticated' && session.authError !== 'RefreshTokenError',
    isAuthReady: status !== 'loading',
    loading,
    error,
  };
};
