import { updateBackendAuthSession } from '@/auth';
import { refreshGatewaySession } from '@/features/auth/api/server/gateway-auth';
import { buildGatewayUrl } from '@/lib/api/server/gateway-url';
import {
  getServerAuthToken,
  hasBackendTokens,
  type BackendTokenUpdate,
} from '@/lib/auth/auth-session';
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'if-match',
  'x-request-id',
] as const;

const inFlightRefreshes = new Map<string, Promise<BackendTokenUpdate>>();
const NO_BODY_STATUS_CODES = new Set([204, 205, 304]);

interface RouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

const createProxyHeaders = (
  request: NextRequest,
  accessToken: string,
): Record<string, string> => {
  const headers: Record<string, string> = {};

  FORWARDED_REQUEST_HEADERS.forEach((key) => {
    const value = request.headers.get(key);

    if (value) {
      headers[key] = value;
    }
  });

  headers.Authorization = `Bearer ${accessToken}`;

  return headers;
};

const createResponseHeaders = (
  gatewayHeaders: Record<string, unknown>,
): Headers => {
  const headers = new Headers();

  Object.entries(gatewayHeaders).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase();

    if (
      value === undefined ||
      value === null ||
      [
        'connection',
        'content-encoding',
        'content-length',
        'set-cookie',
        'transfer-encoding',
      ].includes(normalizedKey)
    ) {
      return;
    }

    headers.set(
      key,
      Array.isArray(value) ? value.map(String).join(', ') : String(value),
    );
  });

  headers.set('Cache-Control', 'no-store');

  return headers;
};

const readRequestBody = async (
  request: NextRequest,
): Promise<ArrayBuffer | undefined> => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  return request.arrayBuffer();
};

const sendGatewayRequest = async (
  request: NextRequest,
  path: string[],
  body: ArrayBuffer | undefined,
  accessToken: string,
): Promise<AxiosResponse<ArrayBuffer>> => {
  const config: AxiosRequestConfig = {
    data: body,
    headers: createProxyHeaders(request, accessToken),
    maxRedirects: 0,
    method: request.method,
    responseType: 'arraybuffer',
    transformResponse: [(data) => data],
    url: buildGatewayUrl(path, new URL(request.url).search),
    validateStatus: () => true,
  };

  return axios.request<ArrayBuffer>(config);
};

const createGatewayResponse = (
  gatewayResponse: AxiosResponse<ArrayBuffer>,
): NextResponse => {
  const status = gatewayResponse.status;

  return new NextResponse(
    NO_BODY_STATUS_CODES.has(status) ? null : gatewayResponse.data,
    {
      headers: createResponseHeaders(
        gatewayResponse.headers as Record<string, unknown>,
      ),
      status,
      statusText: gatewayResponse.statusText,
    },
  );
};

const describeProxyError = (error: unknown): Record<string, unknown> => {
  if (axios.isAxiosError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.response?.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: 'Unknown proxy error',
  };
};

const persistBackendAuthSession = async (
  update: BackendTokenUpdate,
): Promise<void> => {
  try {
    await updateBackendAuthSession(update);
  } catch (error) {
    console.warn(
      '[BFF] Refreshed gateway session could not be persisted',
      describeProxyError(error),
    );
  }
};

const refreshSession = async (
  refreshToken: string,
): Promise<BackendTokenUpdate> => {
  const existingRefresh = inFlightRefreshes.get(refreshToken);

  if (existingRefresh) {
    return existingRefresh;
  }

  const refresh = refreshGatewaySession(refreshToken)
    .then(async (update) => {
      await persistBackendAuthSession(update);

      return update;
    })
    .finally(() => {
      inFlightRefreshes.delete(refreshToken);
    });

  inFlightRefreshes.set(refreshToken, refresh);

  return refresh;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path = [] } = await context.params;

  if (path[0] === 'auth') {
    return NextResponse.json(
      { message: 'Auth endpoints are not available through the BFF proxy' },
      { status: 404 },
    );
  }

  try {
    const authToken = await getServerAuthToken(request);

    if (!hasBackendTokens(authToken) || authToken.authError) {
      return NextResponse.json(
        { message: 'Authentication is required', statusCode: 401 },
        { status: 401 },
      );
    }

    const body = await readRequestBody(request);
    let accessToken = authToken.accessToken;
    let refreshToken = authToken.refreshToken;
    let refreshed = false;

    if (
      authToken.accessTokenExpiresAt <=
      Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS
    ) {
      const update = await refreshSession(refreshToken);
      accessToken = update.accessToken;
      refreshToken = update.refreshToken;
      refreshed = true;
    }

    let gatewayResponse = await sendGatewayRequest(
      request,
      path,
      body,
      accessToken,
    );

    if (gatewayResponse.status === 401 && !refreshed) {
      const update = await refreshSession(refreshToken);
      gatewayResponse = await sendGatewayRequest(
        request,
        path,
        body,
        update.accessToken,
      );
    }

    return createGatewayResponse(gatewayResponse);
  } catch (error) {
    console.error('[BFF] Gateway proxy request failed', {
      ...describeProxyError(error),
      method: request.method,
      path: path.join('/'),
    });

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return NextResponse.json(
        { message: 'Authentication is required', statusCode: 401 },
        { status: 401 },
      );
    }

    const message = axios.isAxiosError(error)
      ? error.message
      : 'Unable to reach the API gateway';

    return NextResponse.json(
      {
        message,
        statusCode: 502,
      },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
