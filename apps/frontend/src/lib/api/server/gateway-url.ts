import 'server-only';

const DEFAULT_GATEWAY_URL = 'http://localhost:3001';
const DEFAULT_GATEWAY_API_PREFIX = '/api/v1';

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

interface BuildGatewayUrlOptions {
  includeApiPrefix?: boolean;
}

export const buildGatewayUrl = (
  path: string | string[],
  search = '',
  options: BuildGatewayUrlOptions = {},
): string => {
  const gatewayUrl = process.env.API_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;
  const gatewayApiPrefix =
    process.env.API_GATEWAY_API_PREFIX ?? DEFAULT_GATEWAY_API_PREFIX;
  const pathSegments = Array.isArray(path) ? path : [path];
  const targetPath = [
    ...(options.includeApiPrefix === false
      ? []
      : [trimSlashes(gatewayApiPrefix)]),
    ...pathSegments.map(trimSlashes).filter(Boolean),
  ].join('/');
  const targetUrl = new URL(targetPath, `${gatewayUrl.replace(/\/+$/g, '')}/`);
  targetUrl.search = search;

  return targetUrl.toString();
};
