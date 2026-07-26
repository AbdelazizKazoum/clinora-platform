import { StaffMember } from '../entities/staff-member';
import { StaffRole } from '../enums/staff-role.enum';
import { StaffStatus } from '../enums/staff-status.enum';

export interface CreateStaffMember {
  clinicId: string;
  userId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  specialization?: string;
  avatar?: string;
}

export interface UpdateStaffMember {
  role?: StaffRole;
  status?: StaffStatus;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string;
  specialization?: string | null;
  avatar?: string | null;
  isActive?: boolean;
}

export interface StaffMemberRepository {
  create(input: CreateStaffMember): Promise<StaffMember>;
  findById(clinicId: string, id: string): Promise<StaffMember | null>;
  findByUserId(
    clinicId: string,
    userId: string,
  ): Promise<StaffMember | null>;
  findByEmail(clinicId: string, email: string): Promise<StaffMember | null>;
  list(clinicId: string): Promise<StaffMember[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdateStaffMember,
  ): Promise<StaffMember | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
}
