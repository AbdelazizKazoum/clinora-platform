import type { StaffRole, StaffStatus } from '@clinora/contracts-clinic';

import type { JwtPayload } from '../../common/auth/jwt-payload';
import { StaffController } from './staff.controller';
import type { StaffFacade } from './staff.facade';

const clinicId = '10000000-0000-4000-8000-000000000001';
const staffMemberId = '20000000-0000-4000-8000-000000000001';
const userId = '30000000-0000-4000-8000-000000000001';
const doctorRole: StaffRole = 'DOCTOR';
const activeStatus: StaffStatus = 'active';
const onLeaveStatus: StaffStatus = 'on-leave';

describe(StaffController.name, () => {
  const staffMember = {
    id: staffMemberId,
    clinicId,
    userId,
    role: doctorRole,
    status: activeStatus,
    firstName: 'Salma',
    lastName: 'El Mansouri',
    phone: '',
    email: 'salma.elmansouri@example.ma',
    specialization: '',
    avatar: '',
    isActive: true,
    createdAt: '2026-07-29T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
  };

  const facade: jest.Mocked<
    Pick<
      StaffFacade,
      | 'listStaffMembers'
      | 'createStaffMember'
      | 'getStaffMember'
      | 'updateStaffMember'
    >
  > = {
    listStaffMembers: jest.fn(),
    createStaffMember: jest.fn(),
    getStaffMember: jest.fn(),
    updateStaffMember: jest.fn(),
  };

  const controller = new StaffController(facade as unknown as StaffFacade);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('delegates staff listing with the clinic path parameter', async () => {
    facade.listStaffMembers.mockResolvedValue({ items: [staffMember] });

    await expect(controller.listStaffMembers(clinicId)).resolves.toEqual({
      items: [staffMember],
    });
    expect(facade.listStaffMembers).toHaveBeenCalledWith({ clinicId });
  });

  it('delegates staff creation without creating auth work in the gateway', async () => {
    facade.createStaffMember.mockResolvedValue(staffMember);

    await controller.createStaffMember(clinicId, {
      role: doctorRole,
      firstName: 'Salma',
      lastName: 'El Mansouri',
      email: staffMember.email,
      password: 'StrongPassword123!',
    });

    expect(facade.createStaffMember).toHaveBeenCalledWith({
      clinicId,
      role: doctorRole,
      firstName: 'Salma',
      lastName: 'El Mansouri',
      email: staffMember.email,
      password: 'StrongPassword123!',
    });
  });

  it('delegates lookup by authenticated user id', async () => {
    facade.getStaffMember.mockResolvedValue(staffMember);

    await controller.getStaffMember(clinicId, userId);

    expect(facade.getStaffMember).toHaveBeenCalledWith({
      clinicId,
      userId,
    });
  });

  it('derives the update actor from verified token claims', async () => {
    facade.updateStaffMember.mockResolvedValue({
      ...staffMember,
      status: onLeaveStatus,
    });
    const user = {
      user_id: userId,
      clinic_id: clinicId,
      role: 'admin',
      iat: 1,
      exp: 2,
    } satisfies JwtPayload;

    await controller.updateStaffMember(
      clinicId,
      staffMemberId,
      { status: onLeaveStatus, phone: '' },
      user,
    );

    expect(facade.updateStaffMember).toHaveBeenCalledWith({
      clinicId,
      staffMemberId,
      actorUserId: userId,
      status: onLeaveStatus,
      phone: '',
    });
  });
});
