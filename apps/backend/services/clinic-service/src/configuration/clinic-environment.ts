interface ClinicEnvironment {
  PORT: number;
  GRPC_PORT: number;
  AUTH_SERVICE_GRPC_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_MIGRATIONS_RUN: boolean;
}

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

function positiveNumber(
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

export function validateClinicEnvironment(
  environment: Record<string, unknown>,
): ClinicEnvironment {
  return {
    PORT: positiveNumber(environment, 'PORT', 3003),
    GRPC_PORT: positiveNumber(environment, 'GRPC_PORT', 5002),
    AUTH_SERVICE_GRPC_URL: requiredString(
      environment,
      'AUTH_SERVICE_GRPC_URL',
    ),
    DB_HOST: requiredString(environment, 'DB_HOST'),
    DB_PORT: positiveNumber(environment, 'DB_PORT', 3306),
    DB_USERNAME: requiredString(environment, 'DB_USERNAME'),
    DB_PASSWORD: requiredString(environment, 'DB_PASSWORD'),
    DB_NAME: requiredString(environment, 'DB_NAME'),
    DB_MIGRATIONS_RUN: environment['DB_MIGRATIONS_RUN'] !== 'false',
  };
}
