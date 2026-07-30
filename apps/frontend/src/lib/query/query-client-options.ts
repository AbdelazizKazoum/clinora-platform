import type { QueryClientConfig } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

const AUTHORIZATION_ERROR_STATUSES = new Set([401, 403]);
const MAX_QUERY_RETRY_COUNT = 1;

export const shouldRetryQuery = (
  failureCount: number,
  error: Error,
): boolean => {
  if (
    error instanceof ApiError &&
    error.status !== undefined &&
    AUTHORIZATION_ERROR_STATUSES.has(error.status)
  ) {
    return false;
  }

  return failureCount <= MAX_QUERY_RETRY_COUNT;
};

export const queryClientOptions: QueryClientConfig = {
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: shouldRetryQuery,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
};
