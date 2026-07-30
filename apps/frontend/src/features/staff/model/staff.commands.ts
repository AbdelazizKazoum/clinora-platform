import type { StaffRole } from './staff';

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
