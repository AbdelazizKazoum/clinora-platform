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
  'if-none-match',
  'x-request-id',
] as const;

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

const refreshSession = async (
  refreshToken: string,
): Promise<BackendTokenUpdate> => {
  const update = await refreshGatewaySession(refreshToken);
  await updateBackendAuthSession(update);

  return update;
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

    return new NextResponse(gatewayResponse.data, {
      headers: createResponseHeaders(
        gatewayResponse.headers as Record<string, unknown>,
      ),
      status: gatewayResponse.status,
      statusText: gatewayResponse.statusText,
    });
  } catch (error) {
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
