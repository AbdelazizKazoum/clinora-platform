import { validateGatewayEnvironment } from './gateway-environment';

describe('validateGatewayEnvironment', () => {
  const validEnvironment = {
    JWT_SECRET: 'a-secure-access-token-secret-32-chars',
  };

  it('returns the validated JWT secret', () => {
    expect(validateGatewayEnvironment(validEnvironment).JWT_SECRET).toBe(
      validEnvironment.JWT_SECRET,
    );
  });

  it('rejects a missing JWT secret', () => {
    expect(() => validateGatewayEnvironment({})).toThrow(
      'JWT_SECRET is required',
    );
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(() =>
      validateGatewayEnvironment({ JWT_SECRET: 'too-short' }),
    ).toThrow('JWT_SECRET must contain at least 32 characters');
  });
});
