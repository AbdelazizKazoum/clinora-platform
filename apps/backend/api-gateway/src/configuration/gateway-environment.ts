interface GatewayEnvironment {
  NODE_ENV: string;
  COOKIE_SECURE: boolean;
  PORT: number;
  JWT_SECRET: string;
  AUTH_SERVICE_GRPC_URL: string;
  APPOINTMENT_SERVICE_GRPC_URL: string;
  CLINIC_SERVICE_GRPC_URL: string;
  PATIENT_SERVICE_GRPC_URL: string;
  NATS_URL: string;
  FRONTEND_ORIGINS: string[];
}

export function validateGatewayEnvironment(
  environment: Record<string, unknown>,
): GatewayEnvironment {
  const nodeEnvironment = String(environment['NODE_ENV'] ?? 'development');
  const port = Number(environment['PORT'] ?? 3001);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  const jwtSecret = environment['JWT_SECRET'];
  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET is required');
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  const authServiceUrl =
    typeof environment['AUTH_SERVICE_GRPC_URL'] === 'string'
      ? environment['AUTH_SERVICE_GRPC_URL']
      : 'localhost:5001';
  const appointmentServiceUrl =
    typeof environment['APPOINTMENT_SERVICE_GRPC_URL'] === 'string'
      ? environment['APPOINTMENT_SERVICE_GRPC_URL']
      : 'localhost:5004';
  const clinicServiceUrl =
    typeof environment['CLINIC_SERVICE_GRPC_URL'] === 'string'
      ? environment['CLINIC_SERVICE_GRPC_URL']
      : 'localhost:5002';
  const patientServiceUrl =
    typeof environment['PATIENT_SERVICE_GRPC_URL'] === 'string'
      ? environment['PATIENT_SERVICE_GRPC_URL']
      : 'localhost:5003';
  const natsUrl =
    typeof environment['NATS_URL'] === 'string' ? environment['NATS_URL'] : '';
  const frontendOrigins = String(
    environment['FRONTEND_ORIGINS'] ?? 'http://localhost:3000',
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    NODE_ENV: nodeEnvironment,
    COOKIE_SECURE:
      environment['COOKIE_SECURE'] === undefined
        ? nodeEnvironment === 'production'
        : environment['COOKIE_SECURE'] === 'true',
    PORT: port,
    JWT_SECRET: jwtSecret,
    AUTH_SERVICE_GRPC_URL: authServiceUrl,
    APPOINTMENT_SERVICE_GRPC_URL: appointmentServiceUrl,
    CLINIC_SERVICE_GRPC_URL: clinicServiceUrl,
    PATIENT_SERVICE_GRPC_URL: patientServiceUrl,
    NATS_URL: natsUrl,
    FRONTEND_ORIGINS: frontendOrigins,
  };
}
