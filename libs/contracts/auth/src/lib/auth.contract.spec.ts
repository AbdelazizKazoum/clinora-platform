import {
  AUTH_USER_ROLES,
  type DeleteProvisionedIdentityReply,
  type ProvisionStaffIdentityRequest,
  type UpdateStaffIdentityRequest,
} from './auth.contract.js';

describe('auth identity-management contract', () => {
  it('types staff provisioning without login tokens', () => {
    const request: ProvisionStaffIdentityRequest = {
      email: 'doctor@clinora.test',
      password: 'StrongPassword123!',
      fullName: 'Clinic Doctor',
      role: 'doctor',
      clinicId: '00000000-0000-4000-8000-000000000001',
    };

    expect(AUTH_USER_ROLES).toContain(request.role);
  });

  it('supports partial staff identity updates including availability', () => {
    const request: UpdateStaffIdentityRequest = {
      userId: '00000000-0000-4000-8000-0000000000a1',
      clinicId: '00000000-0000-4000-8000-000000000001',
      isActive: false,
    };

    expect(request).toMatchObject({ isActive: false });
  });

  it('keeps delete compensation as a token-free acknowledgement', () => {
    const reply: DeleteProvisionedIdentityReply = { deleted: true };

    expect(reply.deleted).toBe(true);
  });
});
