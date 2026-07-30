export const STAFF_ROLES = [
  'SECRETARY',
  'DENTAL_ASSISTANT',
  'DOCTOR',
  'ADMIN',
] as const;

export const STAFF_STATUSES = ['active', 'on-leave', 'inactive'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export interface StaffMember {
  id: string;
  clinicId: string;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string;
  specialization: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const staffRoleLabels = {
  SECRETARY: 'Secretary',
  DENTAL_ASSISTANT: 'Dental Assistant',
  DOCTOR: 'Doctor',
  ADMIN: 'Administrator',
} satisfies Record<StaffRole, string>;

export const staffStatusLabels = {
  active: 'Active',
  'on-leave': 'On Leave',
  inactive: 'Inactive',
} satisfies Record<StaffStatus, string>;

export const staffRoleBadgeClassNames = {
  SECRETARY: 'badge-soft-secondary text-secondary',
  DENTAL_ASSISTANT: 'badge-soft-info text-info',
  DOCTOR: 'badge-soft-primary text-primary',
  ADMIN: 'badge-soft-purple text-purple',
} satisfies Record<StaffRole, string>;

export const staffStatusBadgeClassNames = {
  active: 'badge-soft-success text-success',
  'on-leave': 'badge-soft-warning text-warning',
  inactive: 'badge-soft-danger text-danger',
} satisfies Record<StaffStatus, string>;

export const staffStatusDotClassNames = {
  active: 'bg-success',
  'on-leave': 'bg-warning',
  inactive: 'bg-danger',
} satisfies Record<StaffStatus, string>;
