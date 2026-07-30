import {
  createEmptyCreateStaffFormValues,
  mapCreateStaffFormToCommand,
  validateCreateStaffForm,
  type CreateStaffFormValues,
} from './create-staff-form.schema';

const validValues = (
  overrides: Partial<CreateStaffFormValues> = {},
): CreateStaffFormValues => ({
  ...createEmptyCreateStaffFormValues(),
  firstName: ' Salma ',
  lastName: ' El Mansouri ',
  email: ' SALMA.ELMANSOURI@CLINORA.TEST ',
  phone: ' +212600000000 ',
  role: 'DOCTOR',
  specialization: ' Endodontics ',
  avatar: ' https://cdn.clinora.test/salma.jpg ',
  password: 'StrongPassword123!',
  passwordConfirmation: 'StrongPassword123!',
  ...overrides,
});

describe('create staff form schema', () => {
  it('accepts valid doctor values', () => {
    expect(validateCreateStaffForm(validValues())).toEqual({
      errors: {},
      isValid: true,
    });
  });

  it('requires confirmation to match the password', () => {
    const result = validateCreateStaffForm(
      validValues({ passwordConfirmation: 'DifferentPassword123!' }),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.passwordConfirmation).toBe('Passwords must match.');
  });

  it('requires specialization for doctors only', () => {
    expect(
      validateCreateStaffForm(validValues({ specialization: '' })).errors
        .specialization,
    ).toBe('Doctor specialization is required.');
    expect(
      validateCreateStaffForm(
        validValues({ role: 'SECRETARY', specialization: '' }),
      ).errors.specialization,
    ).toBeUndefined();
  });

  it('maps validated form values into a backend command without UI-only state', () => {
    const command = mapCreateStaffFormToCommand(
      'clinic-1',
      validValues({
        role: 'SECRETARY',
        specialization: 'Ignored for non-doctors',
      }),
    );

    expect(command).toEqual({
      clinicId: 'clinic-1',
      role: 'SECRETARY',
      firstName: 'Salma',
      lastName: 'El Mansouri',
      email: 'salma.elmansouri@clinora.test',
      phone: '+212600000000',
      avatar: 'https://cdn.clinora.test/salma.jpg',
      password: 'StrongPassword123!',
    });
    expect(command).not.toHaveProperty('passwordConfirmation');
    expect(command).not.toHaveProperty('specialization');
  });
});
