import {
  STAFF_STATUSES,
  type StaffMemberReply,
  type UpdateStaffMemberRequest,
} from './clinic.contract.js';

describe('clinic staff lifecycle contract', () => {
  it('keeps staff status as the write-side lifecycle field', () => {
    const request: UpdateStaffMemberRequest = {
      clinicId: '00000000-0000-4000-8000-000000000001',
      staffMemberId: '00000000-0000-4000-8000-0000000000a1',
      status: 'inactive',
    };

    expect(request).toMatchObject({ status: 'inactive' });
    expect('isActive' in request).toBe(false);
  });

  it('retains read-side isActive compatibility data', () => {
    const reply = {
      status: 'inactive',
      isActive: false,
    } as StaffMemberReply;

    expect(reply).toMatchObject({
      status: 'inactive',
      isActive: false,
    });
  });

  it('documents on-leave as an explicit staff lifecycle status', () => {
    expect(STAFF_STATUSES).toContain('on-leave');
  });
});
