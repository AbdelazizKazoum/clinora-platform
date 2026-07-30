import type { CreateStaffMemberCommand, StaffRole } from '../model';
import { STAFF_ROLES } from '../model';

export interface CreateStaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  specialization: string;
  avatar: string;
  password: string;
  passwordConfirmation: string;
}

export type CreateStaffFormField = keyof CreateStaffFormValues;

export type CreateStaffFormErrors = Partial<
  Record<CreateStaffFormField | 'form', string>
>;

export interface CreateStaffFormValidationResult {
  errors: CreateStaffFormErrors;
  isValid: boolean;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const httpUrlPattern = /^https?:\/\/.+/i;

const isStaffRole = (value: string): value is StaffRole =>
  STAFF_ROLES.includes(value as StaffRole);

const hasMaxLength = (value: string, maxLength: number): boolean =>
  value.trim().length <= maxLength;

export const createEmptyCreateStaffFormValues = (): CreateStaffFormValues => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'DOCTOR',
  specialization: '',
  avatar: '',
  password: '',
  passwordConfirmation: '',
});

export const validateCreateStaffForm = (
  values: CreateStaffFormValues,
): CreateStaffFormValidationResult => {
  const errors: CreateStaffFormErrors = {};
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

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (values.password.length > 128) {
    errors.password = 'Password must be 128 characters or fewer.';
  }

  if (!values.passwordConfirmation) {
    errors.passwordConfirmation = 'Confirm the password.';
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'Passwords must match.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

export const mapCreateStaffFormToCommand = (
  clinicId: string,
  values: CreateStaffFormValues,
): CreateStaffMemberCommand => {
  const command: CreateStaffMemberCommand = {
    clinicId,
    role: values.role,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };

  const phone = values.phone.trim();
  const specialization = values.specialization.trim();
  const avatar = values.avatar.trim();

  if (phone) {
    command.phone = phone;
  }

  if (specialization) {
    command.specialization = specialization;
  }

  if (avatar) {
    command.avatar = avatar;
  }

  return command;
};
