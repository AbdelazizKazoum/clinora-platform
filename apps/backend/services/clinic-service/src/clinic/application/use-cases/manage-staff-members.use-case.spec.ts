import { Logger } from '@nestjs/common';

import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type { StaffMemberRepository } from '../../domain/repositories/staff-member-repository.interface';
import {
  ClinicIdentityConsistencyError,
  ClinicRecordNotFoundError,
} from '../errors/clinic.errors';
import type { AuthServicePort } from '../ports/auth-service.port';
import { StaffRole } from '../../domain/enums/staff-role.enum';
import { ManageStaffMembersUseCase } from './manage-staff-members.use-case';

const input = {
  clinicId: 'clinic-id',
  role: StaffRole.Doctor,
  firstName: 'Salma',
  lastName: 'El Mansouri',
  email: 'salma.elmansouri@example.ma',
  password: 'StrongPassword123!',
};

function createClinics(
  overrides: Partial<jest.Mocked<ClinicRepository>> = {},
): jest.Mocked<ClinicRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: input.clinicId }),
    findBySlug: jest.fn(),
    ...overrides,
  } as jest.Mocked<ClinicRepository>;
}

function createStaffMembers(
  overrides: Partial<jest.Mocked<StaffMemberRepository>> = {},
): jest.Mocked<StaffMemberRepository> {
  return {
    create: jest.fn().mockResolvedValue({ id: 'staff-id' }),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<StaffMemberRepository>;
}

function createAuth(
  overrides: Partial<jest.Mocked<AuthServicePort>> = {},
): jest.Mocked<AuthServicePort> {
  return {
    registerStaff: jest.fn(),
    provisionStaffIdentity: jest
      .fn()
      .mockResolvedValue({ id: 'auth-user-id' }),
    updateStaffIdentity: jest.fn(),
    deleteProvisionedIdentity: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<AuthServicePort>;
}

function createUseCase(
  clinics = createClinics(),
  staff = createStaffMembers(),
  auth = createAuth(),
): ManageStaffMembersUseCase {
  return new ManageStaffMembersUseCase(clinics, staff, auth);
}

describe(ManageStaffMembersUseCase.name, () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('does not create auth credentials for an unknown clinic', async () => {
    const clinics = createClinics({
      findById: jest.fn().mockResolvedValue(null),
    });
    const staff = createStaffMembers();
    const auth = createAuth();
    const useCase = createUseCase(clinics, staff, auth);

    await expect(useCase.create(input)).rejects.toBeInstanceOf(
      ClinicRecordNotFoundError,
    );
    expect(auth.provisionStaffIdentity).not.toHaveBeenCalled();
    expect(auth.registerStaff).not.toHaveBeenCalled();
  });

  it('does not save a staff profile when auth provisioning fails', async () => {
    const staff = createStaffMembers();
    const authError = new Error('Auth service unavailable');
    const auth = createAuth({
      provisionStaffIdentity: jest.fn().mockRejectedValue(authError),
    });
    const useCase = createUseCase(createClinics(), staff, auth);

    await expect(useCase.create(input)).rejects.toBe(authError);
    expect(staff.create).not.toHaveBeenCalled();
    expect(auth.deleteProvisionedIdentity).not.toHaveBeenCalled();
  });

  it('provisions an identity before saving clinic membership', async () => {
    const staff = createStaffMembers();
    const auth = createAuth();
    const useCase = createUseCase(createClinics(), staff, auth);

    await useCase.create(input);

    expect(auth.registerStaff).not.toHaveBeenCalled();
    expect(auth.provisionStaffIdentity).toHaveBeenCalledWith({
      clinicId: input.clinicId,
      email: input.email,
      password: input.password,
      fullName: 'Salma El Mansouri',
      role: StaffRole.Doctor,
    });
    expect(staff.create).toHaveBeenCalledWith({
      clinicId: input.clinicId,
      userId: 'auth-user-id',
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: undefined,
      email: input.email,
      specialization: undefined,
      avatar: undefined,
    });
  });

  it('compensates auth provisioning and preserves the original persistence failure', async () => {
    const persistenceError = new Error('Staff profile write failed');
    const staff = createStaffMembers({
      create: jest.fn().mockRejectedValue(persistenceError),
    });
    const auth = createAuth();
    const useCase = createUseCase(createClinics(), staff, auth);

    await expect(useCase.create(input)).rejects.toBe(persistenceError);
    expect(auth.deleteProvisionedIdentity).toHaveBeenCalledWith({
      userId: 'auth-user-id',
      clinicId: input.clinicId,
    });
  });

  it('raises a consistency error and logs safe diagnostics when compensation fails', async () => {
    const persistenceError = new Error('Staff profile write failed');
    const compensationError = new Error('Auth delete failed');
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const staff = createStaffMembers({
      create: jest.fn().mockRejectedValue(persistenceError),
    });
    const auth = createAuth({
      deleteProvisionedIdentity: jest
        .fn()
        .mockRejectedValue(compensationError),
    });
    const useCase = createUseCase(createClinics(), staff, auth);

    await expect(useCase.create(input)).rejects.toBeInstanceOf(
      ClinicIdentityConsistencyError,
    );

    const loggedText = loggerSpy.mock.calls.flat().join(' ');
    expect(loggedText).toContain('deleteProvisionedIdentity');
    expect(loggedText).toContain('auth-user-id');
    expect(loggedText).toContain(input.clinicId);
    expect(loggedText).toContain('correlationId');
    expect(loggedText).not.toContain(input.password);
  });
});
