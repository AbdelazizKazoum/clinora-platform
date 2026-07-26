import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { toApiError, type ApiErrorBody } from './api-error';

const BFF_BASE_URL = '/api/bff';
export const API_ACCESS_TOKEN_STORAGE_KEY = 'clinora.accessToken';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const readAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(API_ACCESS_TOKEN_STORAGE_KEY);
};

export const setApiAccessToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(API_ACCESS_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.sessionStorage.removeItem(API_ACCESS_TOKEN_STORAGE_KEY);
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BFF_BASE_URL,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 20_000,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = readAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        originalRequest.url !== '/auth/refresh'
      ) {
        originalRequest._retry = true;

        try {
          const refreshResponse = await client.post<{ accessToken: string }>(
            '/auth/refresh',
          );
          setApiAccessToken(refreshResponse.data.accessToken);
          return client(originalRequest);
        } catch (refreshError) {
          setApiAccessToken(null);
          return Promise.reject(
            axios.isAxiosError<ApiErrorBody>(refreshError)
              ? toApiError(refreshError)
              : refreshError,
          );
        }
      }

      return Promise.reject(
        axios.isAxiosError<ApiErrorBody>(error) ? toApiError(error) : error,
      );
    },
  );

  return client;
};

export const apiClient = createApiClient();
