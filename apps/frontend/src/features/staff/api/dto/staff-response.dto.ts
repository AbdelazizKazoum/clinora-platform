import type { StaffRole, StaffStatus } from '../../model/staff';

export interface StaffMemberResponseDto {
  id: string;
  clinicId: string;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  specialization: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListStaffMembersResponseDto {
  items: StaffMemberResponseDto[];
}
