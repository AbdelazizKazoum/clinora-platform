import type { StaffMember } from './staff';

export interface ListStaffMembersQuery {
  clinicId: string;
}

export type ListStaffMembersResult = StaffMember[];
