import { useAuth } from '../src/features/auth/hooks/use-auth';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

const replace = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace }),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: () => ({
    data: {
      user: {
        clinicId: 'clinic-id',
        email: 'admin@example.com',
        fullName: 'Admin User',
        id: 'user-id',
        role: 'admin',
      },
    },
    status: 'authenticated',
    update: jest.fn(),
  }),
}));

const AuthState = () => {
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) return <span>pending</span>;

  return <span>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>;
};

describe('authentication hydration', () => {
  it('uses the same initial state on the server and client', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<AuthState />);
    const recoverableErrors = [];

    let root;
    await act(async () => {
      root = hydrateRoot(container, <AuthState />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(container.textContent).toBe('authenticated');

    await act(async () => root.unmount());
  });
});
