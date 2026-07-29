interface AuthEnvironment {
  PORT: number;
  GRPC_PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_MIGRATIONS_RUN: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: number;
}

const MAX_ACCESS_TOKEN_LIFETIME_SECONDS = 900;

function requiredString(
  environment: Record<string, unknown>,
  key: string,
): string {
  const value = environment[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function numberValue(
  environment: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = Number(environment[key] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number`);
  }
  return value;
}

export function validateAuthEnvironment(
  environment: Record<string, unknown>,
): AuthEnvironment {
  const jwtSecret = requiredString(environment, 'JWT_SECRET');
  const refreshTokenSecret = requiredString(
    environment,
    'REFRESH_TOKEN_SECRET',
  );

  if (jwtSecret.length < 32 || refreshTokenSecret.length < 32) {
    throw new Error('JWT secrets must contain at least 32 characters');
  }

  const jwtExpiresIn = numberValue(environment, 'JWT_EXPIRES_IN', 900);
  if (jwtExpiresIn > MAX_ACCESS_TOKEN_LIFETIME_SECONDS) {
    throw new Error('JWT_EXPIRES_IN must not exceed 900 seconds');
  }

  return {
    PORT: numberValue(environment, 'PORT', 3002),
    GRPC_PORT: numberValue(environment, 'GRPC_PORT', 5001),
    DB_HOST: requiredString(environment, 'DB_HOST'),
    DB_PORT: numberValue(environment, 'DB_PORT', 3306),
    DB_USERNAME: requiredString(environment, 'DB_USERNAME'),
    DB_PASSWORD: requiredString(environment, 'DB_PASSWORD'),
    DB_NAME: requiredString(environment, 'DB_NAME'),
    DB_MIGRATIONS_RUN: environment['DB_MIGRATIONS_RUN'] !== 'false',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    REFRESH_TOKEN_SECRET: refreshTokenSecret,
    REFRESH_TOKEN_EXPIRES_IN: numberValue(
      environment,
      'REFRESH_TOKEN_EXPIRES_IN',
      604800,
    ),
  };
}
