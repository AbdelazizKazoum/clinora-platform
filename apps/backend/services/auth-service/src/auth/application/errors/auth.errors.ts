export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email already registered for this clinic');
    this.name = EmailAlreadyRegisteredError.name;
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = InvalidCredentialsError.name;
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = InvalidRefreshTokenError.name;
  }
}

export class AuthIdentityNotFoundError extends Error {
  constructor(userId: string) {
    super(`Auth identity "${userId}" was not found`);
    this.name = AuthIdentityNotFoundError.name;
  }
}

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = AuthValidationError.name;
  }
}
