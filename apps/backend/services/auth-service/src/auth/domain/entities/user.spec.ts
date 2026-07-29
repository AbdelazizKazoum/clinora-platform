import { User } from './user';
import { UserRole } from '../enums/user-role.enum';

describe(User.name, () => {
  const properties = {
    id: '00000000-0000-4000-8000-0000000000a1',
    clinicId: '00000000-0000-4000-8000-000000000001',
    email: 'admin@clinora.test',
    passwordHash: 'hashed-password',
    fullName: 'Clinic Admin',
    role: UserRole.Admin,
    createdAt: new Date('2026-07-26T00:00:00.000Z'),
  };

  it('defaults a new auth identity to active', () => {
    const user = new User(properties);

    expect(user.isActive).toBe(true);
  });

  it('returns a new identity snapshot when account availability changes', () => {
    const user = new User(properties);
    const inactiveUser = user.changeAvailability(false);

    expect(inactiveUser).not.toBe(user);
    expect(inactiveUser).toMatchObject({
      id: user.id,
      clinicId: user.clinicId,
      isActive: false,
    });
    expect(user.isActive).toBe(true);
  });
});
