import type { StaffMember } from '@/features/staff';

const providerColorClassNames = [
  'bg-primary-subtle text-primary',
  'bg-success-subtle text-success',
  'bg-info-subtle text-info',
  'bg-warning-subtle text-warning',
  'bg-secondary-subtle text-secondary',
] as const;

export interface AppointmentProvider {
  doctorId: string;
  name: string;
  avatar: string | null;
  colorClassName: string;
  initials: string;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const projectActiveDoctorProviders = (
  staffMembers: readonly StaffMember[],
): AppointmentProvider[] =>
  staffMembers
    .filter(
      (staffMember) =>
        staffMember.role === 'DOCTOR' &&
        staffMember.status === 'active' &&
        staffMember.isActive,
    )
    .map((staffMember, index) => ({
      avatar: staffMember.avatar,
      colorClassName:
        providerColorClassNames[index % providerColorClassNames.length],
      doctorId: staffMember.userId,
      initials: getInitials(staffMember.fullName),
      name: staffMember.fullName,
    }));

export const toggleVisibleProviderId = (
  visibleProviderIds: readonly string[],
  providerId: string,
): string[] => {
  if (visibleProviderIds.includes(providerId)) {
    return visibleProviderIds.length === 1
      ? [...visibleProviderIds]
      : visibleProviderIds.filter((id) => id !== providerId);
  }

  return [...visibleProviderIds, providerId];
};
