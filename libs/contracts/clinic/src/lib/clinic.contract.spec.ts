import {
  STAFF_STATUSES,
  type DeleteStaffMemberRequest,
  type StaffMemberReply,
  type UpdateStaffMemberRequest,
} from './clinic.contract.js';

describe('clinic staff lifecycle contract', () => {
  it('keeps staff status as the write-side lifecycle field', () => {
    const request: UpdateStaffMemberRequest = {
      clinicId: '00000000-0000-4000-8000-000000000001',
      staffMemberId: '00000000-0000-4000-8000-0000000000a1',
      actorUserId: '00000000-0000-4000-8000-0000000000b2',
      status: 'inactive',
    };

    expect(request).toMatchObject({
      actorUserId: '00000000-0000-4000-8000-0000000000b2',
      status: 'inactive',
    });
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

  it('keeps delete as a deprecated backend contract while removal is represented by inactive status', () => {
    const legacyDeleteRequest: DeleteStaffMemberRequest = {
      clinicId: '00000000-0000-4000-8000-000000000001',
      staffMemberId: '00000000-0000-4000-8000-0000000000a1',
    };
    const removalRequest: UpdateStaffMemberRequest = {
      clinicId: legacyDeleteRequest.clinicId,
      staffMemberId: legacyDeleteRequest.staffMemberId,
      actorUserId: '00000000-0000-4000-8000-0000000000b2',
      status: 'inactive',
    };

    expect(removalRequest.status).toBe('inactive');
  });
});
