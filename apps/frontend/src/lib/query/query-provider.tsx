'use client';

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { queryClientOptions } from './query-client-options';

const ANONYMOUS_QUERY_CACHE_OWNER = 'anonymous';
const LOADING_QUERY_CACHE_OWNER = 'loading';

type QueryCacheOwner =
  | typeof ANONYMOUS_QUERY_CACHE_OWNER
  | typeof LOADING_QUERY_CACHE_OWNER
  | `user:${string}:clinic:${string}`;

const getQueryCacheOwner = (
  status: 'authenticated' | 'loading' | 'unauthenticated',
  user?: { clinicId?: string | null; id?: string | null } | null,
  authError?: string | null,
): QueryCacheOwner => {
  if (status === 'loading') {
    return LOADING_QUERY_CACHE_OWNER;
  }

  if (
    status !== 'authenticated' ||
    authError === 'RefreshTokenError' ||
    !user?.id ||
    !user.clinicId
  ) {
    return ANONYMOUS_QUERY_CACHE_OWNER;
  }

  return `user:${user.id}:clinic:${user.clinicId}`;
};

const QuerySessionCacheBoundary = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const previousOwnerRef = useRef<QueryCacheOwner | null>(null);

  const cacheOwner = useMemo(
    () => getQueryCacheOwner(status, session?.user, session?.authError),
    [session?.authError, session?.user, status],
  );

  useEffect(() => {
    if (cacheOwner === LOADING_QUERY_CACHE_OWNER) {
      return;
    }

    if (previousOwnerRef.current === null) {
      previousOwnerRef.current = cacheOwner;
      return;
    }

    if (previousOwnerRef.current !== cacheOwner) {
      queryClient.clear();
      previousOwnerRef.current = cacheOwner;
    }
  }, [cacheOwner, queryClient]);

  return children;
};

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>
      <QuerySessionCacheBoundary>{children}</QuerySessionCacheBoundary>
    </QueryClientProvider>
  );
};
