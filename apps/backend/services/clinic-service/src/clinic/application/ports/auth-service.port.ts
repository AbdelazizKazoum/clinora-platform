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

export interface ProvisionStaffIdentity {
  clinicId: string;
  email: string;
  password: string;
  fullName: string;
  role: StaffRole;
}

export interface ProvisionedStaffIdentity {
  id: string;
}

export interface UpdateStaffIdentity {
  userId: string;
  clinicId: string;
  email?: string;
  fullName?: string;
  role?: StaffRole;
  isActive?: boolean;
}

export interface UpdatedStaffIdentity {
  id: string;
}

export interface DeleteProvisionedIdentity {
  userId: string;
  clinicId: string;
}

export interface AuthServicePort {
  registerStaff(input: RegisterStaffUser): Promise<RegisteredStaffUser>;
  provisionStaffIdentity(
    input: ProvisionStaffIdentity,
  ): Promise<ProvisionedStaffIdentity>;
  updateStaffIdentity(
    input: UpdateStaffIdentity,
  ): Promise<UpdatedStaffIdentity>;
  deleteProvisionedIdentity(input: DeleteProvisionedIdentity): Promise<void>;
}
