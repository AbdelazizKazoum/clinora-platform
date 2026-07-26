interface PatientEnvironment {
  PORT: number;
  GRPC_PORT: number;
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

export function validatePatientEnvironment(
  environment: Record<string, unknown>,
): PatientEnvironment {
  return {
    PORT: positiveNumber(environment, 'PORT', 3004),
    GRPC_PORT: positiveNumber(environment, 'GRPC_PORT', 5003),
    DB_HOST: requiredString(environment, 'DB_HOST'),
    DB_PORT: positiveNumber(environment, 'DB_PORT', 3306),
    DB_USERNAME: requiredString(environment, 'DB_USERNAME'),
    DB_PASSWORD: requiredString(environment, 'DB_PASSWORD'),
    DB_NAME: requiredString(environment, 'DB_NAME'),
    DB_MIGRATIONS_RUN: environment['DB_MIGRATIONS_RUN'] !== 'false',
  };
}
