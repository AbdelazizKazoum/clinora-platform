import type { AuthServicePort } from '../ports/auth-service.port';
import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type { StaffMemberRepository } from '../../domain/repositories/staff-member-repository.interface';
import { ClinicRecordNotFoundError } from '../errors/clinic.errors';
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

describe('ManageStaffMembersUseCase', () => {
  it('does not create auth credentials for an unknown clinic', async () => {
    const clinics = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ClinicRepository;
    const staff = {} as StaffMemberRepository;
    const auth = {
      registerStaff: jest.fn(),
    } as unknown as AuthServicePort;
    const useCase = new ManageStaffMembersUseCase(
      clinics,
      staff,
      auth,
    );

    await expect(useCase.create(input)).rejects.toBeInstanceOf(
      ClinicRecordNotFoundError,
    );
    expect(auth.registerStaff).not.toHaveBeenCalled();
  });

  it('registers auth credentials before saving clinic membership', async () => {
    const clinics = {
      findById: jest.fn().mockResolvedValue({ id: input.clinicId }),
    } as unknown as ClinicRepository;
    const staff = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'staff-id' }),
    } as unknown as StaffMemberRepository;
    const auth = {
      registerStaff: jest
        .fn()
        .mockResolvedValue({ id: 'auth-user-id' }),
    } as unknown as AuthServicePort;
    const useCase = new ManageStaffMembersUseCase(
      clinics,
      staff,
      auth,
    );

    await useCase.create(input);

    expect(auth.registerStaff).toHaveBeenCalledWith({
      clinicId: input.clinicId,
      email: input.email,
      password: input.password,
      fullName: 'Salma El Mansouri',
      role: StaffRole.Doctor,
    });
    expect(staff.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: input.clinicId,
        userId: 'auth-user-id',
      }),
    );
  });
});
