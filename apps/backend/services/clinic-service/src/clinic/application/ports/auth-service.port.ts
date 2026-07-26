import { StaffRole } from '../../domain/enums/staff-role.enum';

export interface RegisterStaffUser {
  clinicId: string;
  email: string;
  password: string;
  fullName: string;
  role: StaffRole;
}

export interface RegisteredStaffUser {
  id: string;
}

export interface AuthServicePort {
  registerStaff(input: RegisterStaffUser): Promise<RegisteredStaffUser>;
}
