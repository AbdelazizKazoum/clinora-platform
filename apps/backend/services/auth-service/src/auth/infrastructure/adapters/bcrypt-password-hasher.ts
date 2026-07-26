import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import type { PasswordHasher } from '../../application/ports/password-hasher.interface';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, 12);
  }

  compare(password: string, passwordHash: string): Promise<boolean> {
    return compare(password, passwordHash);
  }
}
