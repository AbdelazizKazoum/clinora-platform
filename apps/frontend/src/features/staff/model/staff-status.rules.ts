import type { StaffStatus } from './staff';

const allowedStaffStatusTransitions = {
  active: ['on-leave', 'inactive'],
  'on-leave': ['active', 'inactive'],
  inactive: ['active'],
} satisfies Record<StaffStatus, readonly StaffStatus[]>;

export const getAvailableStaffStatusTransitions = (
  status: StaffStatus,
): readonly StaffStatus[] => allowedStaffStatusTransitions[status];

export const getEditableStaffStatusOptions = (
  status: StaffStatus,
): readonly StaffStatus[] => [
  status,
  ...allowedStaffStatusTransitions[status],
];

export const isStaffDeactivationStatus = (status: StaffStatus): boolean =>
  status === 'inactive';
