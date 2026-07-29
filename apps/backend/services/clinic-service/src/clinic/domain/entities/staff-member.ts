import { StaffRole } from '../enums/staff-role.enum';
import { StaffStatus } from '../enums/staff-status.enum';

export interface StaffMemberProperties {
  id: string;
  clinicId: string;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  specialization: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function deriveStaffMemberIsActive(status: StaffStatus): boolean {
  return status !== StaffStatus.Inactive;
}

export class StaffMember {
  constructor(readonly properties: StaffMemberProperties) {}

  get id(): string {
    return this.properties.id;
  }

  get fullName(): string {
    return `${this.properties.firstName} ${this.properties.lastName}`;
  }
}
