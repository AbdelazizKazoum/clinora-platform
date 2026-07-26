import axios, { type AxiosInstance } from 'axios';

import { toApiError, type ApiErrorBody } from './api-error';

const BFF_BASE_URL = '/api/bff';

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

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(
        axios.isAxiosError<ApiErrorBody>(error) ? toApiError(error) : error,
      );
    },
  );

  return client;
};

export const apiClient = createApiClient();
