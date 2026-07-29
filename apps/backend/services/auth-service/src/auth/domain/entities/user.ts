import { UserRole } from '../enums/user-role.enum';

export interface UserProperties {
  id: string;
  clinicId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  createdAt: Date;
}

export class User {
  readonly id: string;
  readonly clinicId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: Date;

  constructor(properties: UserProperties) {
    this.id = properties.id;
    this.clinicId = properties.clinicId;
    this.email = properties.email;
    this.passwordHash = properties.passwordHash;
    this.fullName = properties.fullName;
    this.role = properties.role;
    this.isActive = properties.isActive ?? true;
    this.createdAt = properties.createdAt;
  }

  changeAvailability(isActive: boolean): User {
    if (this.isActive === isActive) {
      return this;
    }

    return new User({
      id: this.id,
      clinicId: this.clinicId,
      email: this.email,
      passwordHash: this.passwordHash,
      fullName: this.fullName,
      role: this.role,
      isActive,
      createdAt: this.createdAt,
    });
  }
}
