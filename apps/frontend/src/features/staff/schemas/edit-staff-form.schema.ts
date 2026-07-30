import type {
  StaffMember,
  StaffRole,
  StaffStatus,
  UpdateStaffMemberCommand,
} from '../model';
import { STAFF_ROLES, STAFF_STATUSES } from '../model';

export interface EditStaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  specialization: string;
  avatar: string;
}

export type EditStaffFormField = keyof EditStaffFormValues;

export type EditStaffFormErrors = Partial<
  Record<EditStaffFormField | 'form', string>
>;

export interface EditStaffFormValidationResult {
  errors: EditStaffFormErrors;
  isValid: boolean;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const httpUrlPattern = /^https?:\/\/.+/i;

const isStaffRole = (value: string): value is StaffRole =>
  STAFF_ROLES.includes(value as StaffRole);

const isStaffStatus = (value: string): value is StaffStatus =>
  STAFF_STATUSES.includes(value as StaffStatus);

const hasMaxLength = (value: string, maxLength: number): boolean =>
  value.trim().length <= maxLength;

export const mapStaffMemberToEditStaffForm = (
  staffMember: StaffMember,
): EditStaffFormValues => ({
  firstName: staffMember.firstName,
  lastName: staffMember.lastName,
  email: staffMember.email,
  phone: staffMember.phone ?? '',
  role: staffMember.role,
  status: staffMember.status,
  specialization: staffMember.specialization ?? '',
  avatar: staffMember.avatar ?? '',
});

export const validateEditStaffForm = (
  values: EditStaffFormValues,
): EditStaffFormValidationResult => {
  const errors: EditStaffFormErrors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const specialization = values.specialization.trim();
  const avatar = values.avatar.trim();

  if (!firstName) {
    errors.firstName = 'First name is required.';
  } else if (!hasMaxLength(firstName, 100)) {
    errors.firstName = 'First name must be 100 characters or fewer.';
  }

  if (!lastName) {
    errors.lastName = 'Last name is required.';
  } else if (!hasMaxLength(lastName, 100)) {
    errors.lastName = 'Last name must be 100 characters or fewer.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (!hasMaxLength(email, 255)) {
    errors.email = 'Email address must be 255 characters or fewer.';
  }

  if (phone && !hasMaxLength(phone, 30)) {
    errors.phone = 'Phone number must be 30 characters or fewer.';
  }

  if (!isStaffRole(values.role)) {
    errors.role = 'Choose a valid staff role.';
  }

  if (!isStaffStatus(values.status)) {
    errors.status = 'Choose a valid staff status.';
  }

  if (specialization && !hasMaxLength(specialization, 255)) {
    errors.specialization = 'Specialization must be 255 characters or fewer.';
  }

  if (avatar) {
    if (!httpUrlPattern.test(avatar)) {
      errors.avatar = 'Enter a valid image URL.';
    } else if (!hasMaxLength(avatar, 500)) {
      errors.avatar = 'Avatar URL must be 500 characters or fewer.';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

export const mapEditStaffFormToCommand = (
  staffMember: StaffMember,
  values: EditStaffFormValues,
): UpdateStaffMemberCommand => ({
  clinicId: staffMember.clinicId,
  staffMemberId: staffMember.id,
  role: values.role,
  status: values.status,
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  phone: values.phone.trim(),
  email: values.email.trim().toLowerCase(),
  specialization: values.specialization.trim(),
  avatar: values.avatar.trim(),
});
