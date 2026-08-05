import { updateBackendAuthSession } from '@/auth';
import { refreshGatewaySession } from '@/features/auth/api/server/gateway-auth';
import { buildGatewayUrl } from '@/lib/api/server/gateway-url';
import {
  getServerAuthToken,
  hasBackendTokens,
  type BackendTokenUpdate,
} from '@/lib/auth/auth-session';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

const createStreamHeaders = (
  gatewayHeaders: Headers,
): Record<string, string> => ({
  'Cache-Control':
    gatewayHeaders.get('cache-control') ?? 'no-cache, no-transform',
  Connection: 'keep-alive',
  'Content-Type':
    gatewayHeaders.get('content-type') ?? 'text/event-stream; charset=utf-8',
  'X-Accel-Buffering': 'no',
});

const persistBackendAuthSession = async (
  update: BackendTokenUpdate,
): Promise<void> => {
  try {
    await updateBackendAuthSession(update);
  } catch (error) {
    console.warn('[QueueEvents] Refreshed gateway session could not persist', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

const refreshSession = async (
  refreshToken: string,
): Promise<BackendTokenUpdate> => {
  const update = await refreshGatewaySession(refreshToken);
  await persistBackendAuthSession(update);

  return update;
};

const openGatewayQueueStream = (
  request: NextRequest,
  accessToken: string,
): Promise<Response> =>
  fetch(
    buildGatewayUrl('events/queue', new URL(request.url).search, {
      includeApiPrefix: false,
    }),
    {
      cache: 'no-store',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${accessToken}`,
      },
      signal: request.signal,
    },
  );

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authToken = await getServerAuthToken(request);

    if (!hasBackendTokens(authToken) || authToken.authError) {
      return NextResponse.json(
        { message: 'Authentication is required', statusCode: 401 },
        { status: 401 },
      );
    }

    let accessToken = authToken.accessToken;
    let refreshed = false;

    if (
      authToken.accessTokenExpiresAt <=
      Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS
    ) {
      const update = await refreshSession(authToken.refreshToken);
      accessToken = update.accessToken;
      refreshed = true;
    }

    let gatewayResponse = await openGatewayQueueStream(request, accessToken);

    if (gatewayResponse.status === 401 && !refreshed) {
      const update = await refreshSession(authToken.refreshToken);
      gatewayResponse = await openGatewayQueueStream(
        request,
        update.accessToken,
      );
    }

    if (!gatewayResponse.ok || !gatewayResponse.body) {
      return NextResponse.json(
        {
          message: 'Unable to connect to the queue event stream',
          statusCode: gatewayResponse.status || 502,
        },
        { status: gatewayResponse.status || 502 },
      );
    }

    return new Response(gatewayResponse.body, {
      headers: createStreamHeaders(gatewayResponse.headers),
      status: gatewayResponse.status,
    });
  } catch (error) {
    console.error('[QueueEvents] Gateway stream proxy failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        message: 'Unable to reach the API gateway event stream',
        statusCode: 502,
      },
      { status: 502 },
    );
  }
}
