import type { AxiosError } from 'axios';

export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly body?: ApiErrorBody;

  constructor(message: string, status?: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const toApiError = (error: AxiosError<ApiErrorBody>): ApiError => {
  const body = error.response?.data;
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : (body?.message ?? error.message);

  return new ApiError(message, error.response?.status, body);
};
