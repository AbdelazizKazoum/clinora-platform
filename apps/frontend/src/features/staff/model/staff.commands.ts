import type { StaffRole, StaffStatus } from './staff';

export interface CreateStaffMemberCommand {
  clinicId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  specialization?: string;
  avatar?: string;
  password: string;
}

export interface UpdateStaffMemberCommand {
  clinicId: string;
  staffMemberId: string;
  role?: StaffRole;
  status?: StaffStatus;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  avatar?: string;
}
