import { validateAuthEnvironment } from './auth-environment';

const validEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'clinora',
  DB_PASSWORD: 'clinora',
  DB_NAME: 'clinora_auth',
  JWT_SECRET: 'access-token-secret-at-least-32-chars',
  REFRESH_TOKEN_SECRET: 'refresh-token-secret-at-least-32-chars',
};

describe(validateAuthEnvironment.name, () => {
  it('defaults access tokens to a 15-minute maximum lifetime', () => {
    expect(validateAuthEnvironment(validEnvironment).JWT_EXPIRES_IN).toBe(900);
  });

  it('accepts an access-token lifetime up to 15 minutes', () => {
    expect(
      validateAuthEnvironment({
        ...validEnvironment,
        JWT_EXPIRES_IN: '900',
      }).JWT_EXPIRES_IN,
    ).toBe(900);
  });

  it('rejects an access-token lifetime above 15 minutes', () => {
    expect(() =>
      validateAuthEnvironment({
        ...validEnvironment,
        JWT_EXPIRES_IN: '901',
      }),
    ).toThrow('JWT_EXPIRES_IN must not exceed 900 seconds');
  });
});
