import { fireEvent, render, screen } from '@testing-library/react';

import type { StaffMember } from '../model';
import StaffCard from './staff-card';

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

const createStaffMember = (
  overrides: Partial<StaffMember> = {},
): StaffMember => ({
  id: 'staff-1',
  clinicId: 'clinic-1',
  userId: 'user-1',
  role: 'DOCTOR',
  status: 'active',
  firstName: 'Salma',
  lastName: 'El Mansouri',
  fullName: 'Salma El Mansouri',
  phone: null,
  email: 'salma.elmansouri@clinora.test',
  specialization: 'Endodontics',
  avatar: null,
  isActive: true,
  createdAt: new Date('2026-07-29T10:00:00.000Z'),
  updatedAt: new Date('2026-07-30T10:00:00.000Z'),
  ...overrides,
});

describe(StaffCard.name, () => {
  it('shows valid management actions for an active staff member', () => {
    const onEdit = jest.fn();
    const onStatusChange = jest.fn();
    const staffMember = createStaffMember();

    render(
      <StaffCard
        canManage
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        staffMember={staffMember}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /manage salma/i }));

    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Mark On Leave')).toBeTruthy();
    expect(screen.getByText('Deactivate Account')).toBeTruthy();
    expect(screen.queryByText('Mark Active')).toBeNull();

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(staffMember);

    fireEvent.click(screen.getByText('Deactivate Account'));
    expect(onStatusChange).toHaveBeenCalledWith(staffMember, 'inactive');
  });

  it('shows only reactivation for an inactive staff member', () => {
    render(
      <StaffCard
        canManage
        onEdit={jest.fn()}
        onStatusChange={jest.fn()}
        staffMember={createStaffMember({ status: 'inactive' })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /manage salma/i }));

    expect(screen.getByText('Mark Active')).toBeTruthy();
    expect(screen.queryByText('Mark On Leave')).toBeNull();
    expect(screen.queryByText('Deactivate Account')).toBeNull();
  });

  it('hides management actions when the member is not manageable', () => {
    render(<StaffCard staffMember={createStaffMember()} />);

    expect(screen.queryByRole('button', { name: /manage salma/i })).toBeNull();
  });

  it('falls back to initials when an avatar image cannot load', () => {
    render(
      <StaffCard
        staffMember={createStaffMember({
          avatar: 'https://cdn.clinora.test/missing-avatar.jpg',
        })}
      />,
    );

    fireEvent.error(screen.getByAltText('Salma El Mansouri avatar'));

    expect(screen.queryByAltText('Salma El Mansouri avatar')).toBeNull();
    expect(screen.getByText('SE')).toBeTruthy();
  });
});
