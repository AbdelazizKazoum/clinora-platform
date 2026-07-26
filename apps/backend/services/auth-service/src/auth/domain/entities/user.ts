import { UserRole } from '../enums/user-role.enum';

export interface UserProperties {
  id: string;
  clinicId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export class User {
  readonly id: string;
  readonly clinicId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly createdAt: Date;

  constructor(properties: UserProperties) {
    this.id = properties.id;
    this.clinicId = properties.clinicId;
    this.email = properties.email;
    this.passwordHash = properties.passwordHash;
    this.fullName = properties.fullName;
    this.role = properties.role;
    this.createdAt = properties.createdAt;
  }
}
