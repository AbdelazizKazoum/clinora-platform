interface AppointmentEnvironment {
  PORT: number;
  GRPC_PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_MIGRATIONS_RUN: boolean;
  PATIENT_SERVICE_GRPC_URL: string;
  CLINIC_SERVICE_GRPC_URL: string;
  NATS_URL: string;
  OUTBOX_RELAY_INTERVAL_MS: number;
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

function optionalString(
  environment: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = environment[key];
  return typeof value === 'string' ? value : fallback;
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

export function validateAppointmentEnvironment(
  environment: Record<string, unknown>,
): AppointmentEnvironment {
  return {
    PORT: positiveNumber(environment, 'PORT', 3005),
    GRPC_PORT: positiveNumber(environment, 'GRPC_PORT', 5004),
    DB_HOST: requiredString(environment, 'DB_HOST'),
    DB_PORT: positiveNumber(environment, 'DB_PORT', 3306),
    DB_USERNAME: requiredString(environment, 'DB_USERNAME'),
    DB_PASSWORD: requiredString(environment, 'DB_PASSWORD'),
    DB_NAME: requiredString(environment, 'DB_NAME'),
    DB_MIGRATIONS_RUN: environment['DB_MIGRATIONS_RUN'] !== 'false',
    PATIENT_SERVICE_GRPC_URL: optionalString(
      environment,
      'PATIENT_SERVICE_GRPC_URL',
      'localhost:5003',
    ),
    CLINIC_SERVICE_GRPC_URL: optionalString(
      environment,
      'CLINIC_SERVICE_GRPC_URL',
      'localhost:5002',
    ),
    NATS_URL: optionalString(environment, 'NATS_URL'),
    OUTBOX_RELAY_INTERVAL_MS: positiveNumber(
      environment,
      'OUTBOX_RELAY_INTERVAL_MS',
      500,
    ),
  };
}
