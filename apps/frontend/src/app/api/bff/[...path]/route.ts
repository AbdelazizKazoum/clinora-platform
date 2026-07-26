import axios, { type AxiosRequestConfig } from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_GATEWAY_URL = 'http://localhost:3001';
const DEFAULT_GATEWAY_API_PREFIX = '/api/v1';
const BFF_REFRESH_PATH = '/api/bff/auth/refresh';

interface RouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

const buildGatewayUrl = (path: string[], requestUrl: string): string => {
  const gatewayUrl = process.env.API_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;
  const gatewayApiPrefix =
    process.env.API_GATEWAY_API_PREFIX ?? DEFAULT_GATEWAY_API_PREFIX;
  const targetPath = [
    trimSlashes(gatewayApiPrefix),
    ...path.map(trimSlashes).filter(Boolean),
  ].join('/');
  const targetUrl = new URL(targetPath, `${gatewayUrl.replace(/\/+$/g, '')}/`);
  targetUrl.search = new URL(requestUrl).search;

  return targetUrl.toString();
};

const createProxyHeaders = (request: NextRequest): Record<string, string> => {
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (
      !['connection', 'content-length', 'host', 'transfer-encoding'].includes(
        normalizedKey,
      )
    ) {
      headers[key] = value;
    }
  });

  return headers;
};

const rewriteSetCookiePath = (cookie: string): string =>
  cookie.replace(/Path=\/api\/v1\/auth\/refresh/gi, `Path=${BFF_REFRESH_PATH}`);

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

const appendSetCookieHeaders = (
  response: NextResponse,
  setCookie: string | string[] | undefined,
): void => {
  if (!setCookie) {
    return;
  }

  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  cookies.forEach((cookie) => {
    response.headers.append('set-cookie', rewriteSetCookiePath(cookie));
  });
};

const readRequestBody = async (
  request: NextRequest,
): Promise<ArrayBuffer | undefined> => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  return request.arrayBuffer();
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path = [] } = await context.params;
  const config: AxiosRequestConfig = {
    data: await readRequestBody(request),
    headers: createProxyHeaders(request),
    maxRedirects: 0,
    method: request.method,
    responseType: 'arraybuffer',
    transformResponse: [(data) => data],
    url: buildGatewayUrl(path, request.url),
    validateStatus: () => true,
  };

  try {
    const gatewayResponse = await axios.request<ArrayBuffer>(config);
    const response = new NextResponse(gatewayResponse.data, {
      headers: createResponseHeaders(
        gatewayResponse.headers as Record<string, unknown>,
      ),
      status: gatewayResponse.status,
      statusText: gatewayResponse.statusText,
    });
    appendSetCookieHeaders(
      response,
      gatewayResponse.headers['set-cookie'] as string | string[] | undefined,
    );

    return response;
  } catch (error) {
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
