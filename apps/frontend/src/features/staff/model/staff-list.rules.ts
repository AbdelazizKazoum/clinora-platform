import type { StaffMember, StaffRole, StaffStatus } from './staff';

export type StaffRoleFilter = StaffRole | 'ALL';
export type StaffStatusFilter = StaffStatus | 'ALL';

export interface StaffListFilters {
  role: StaffRoleFilter;
  search: string;
  status: StaffStatusFilter;
}

export interface StaffSummary {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}

const normalizeSearchValue = (value: string): string =>
  value.trim().toLocaleLowerCase();

export const getStaffSummary = (staffMembers: readonly StaffMember[]) =>
  staffMembers.reduce<StaffSummary>(
    (summary, staffMember) => {
      summary.total += 1;

      if (staffMember.status === 'active') {
        summary.active += 1;
      } else if (staffMember.status === 'on-leave') {
        summary.onLeave += 1;
      } else {
        summary.inactive += 1;
      }

      return summary;
    },
    {
      active: 0,
      inactive: 0,
      onLeave: 0,
      total: 0,
    },
  );

export const filterStaffMembers = (
  staffMembers: readonly StaffMember[],
  filters: StaffListFilters,
): StaffMember[] => {
  const search = normalizeSearchValue(filters.search);

  return staffMembers.filter((staffMember) => {
    const matchesRole =
      filters.role === 'ALL' || staffMember.role === filters.role;
    const matchesStatus =
      filters.status === 'ALL' || staffMember.status === filters.status;

    if (!matchesRole || !matchesStatus) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      staffMember.fullName,
      staffMember.email,
      staffMember.phone,
      staffMember.specialization,
    ].some((value) => value?.toLocaleLowerCase().includes(search));
  });
};

export const getStaffInitials = (staffMember: StaffMember): string => {
  const initials = [staffMember.firstName, staffMember.lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase();

  return initials || 'SM';
};
