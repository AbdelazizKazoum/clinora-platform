import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';

import { useUpdateStaffMember } from '../hooks';
import type { StaffMember } from '../model';
import StaffEditModal from './staff-edit-modal';

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

jest.mock('../hooks', () => ({
  useUpdateStaffMember: jest.fn(),
}));

jest.mock('@/store', () => ({
  useNotificationStore: jest.fn(),
}));

const clinicId = '10000000-0000-4000-8000-000000000001';
const mockUpdateStaffMember = jest.fn();
const mockShowNotification = jest.fn();
const mockOnHide = jest.fn();

const staffMember: StaffMember = {
  id: 'staff-1',
  clinicId,
  userId: 'user-1',
  role: 'ADMIN',
  status: 'active',
  firstName: 'Nora',
  lastName: 'Admin',
  fullName: 'Nora Admin',
  phone: '+212600000000',
  email: 'nora.admin@clinora.test',
  specialization: null,
  avatar: null,
  isActive: true,
  createdAt: new Date('2026-07-29T10:00:00.000Z'),
  updatedAt: new Date('2026-07-30T10:00:00.000Z'),
};

const arrangeEditModal = () => {
  jest.mocked(useUpdateStaffMember).mockReturnValue({
    error: null,
    isPending: false,
    reset: jest.fn(),
    updateStaffMember: mockUpdateStaffMember,
  });
  jest
    .mocked(useNotificationStore)
    .mockImplementation((selector) =>
      selector({ showNotification: mockShowNotification }),
    );
};

describe(StaffEditModal.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateStaffMember.mockResolvedValue(staffMember);
  });

  it('submits profile, role, and status changes through one update command', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    arrangeEditModal();
    render(<StaffEditModal onHide={mockOnHide} staffMember={staffMember} />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: ' Nora ' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: ' NORA.UPDATED@CLINORA.TEST ' },
    });
    fireEvent.change(screen.getByLabelText(/^status/i), {
      target: { value: 'inactive' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateStaffMember).toHaveBeenCalledWith({
        clinicId,
        staffMemberId: 'staff-1',
        role: 'ADMIN',
        status: 'inactive',
        firstName: 'Nora',
        lastName: 'Admin',
        phone: '+212600000000',
        email: 'nora.updated@clinora.test',
        specialization: '',
        avatar: '',
      });
    });
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('will lose access to Clinora'),
    );
    expect(mockOnHide).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('does not submit deactivation when confirmation is declined', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    arrangeEditModal();
    render(<StaffEditModal onHide={mockOnHide} staffMember={staffMember} />);

    fireEvent.change(screen.getByLabelText(/^status/i), {
      target: { value: 'inactive' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockUpdateStaffMember).not.toHaveBeenCalled();
    expect(mockOnHide).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('maps backend lifecycle policy errors into form feedback', async () => {
    arrangeEditModal();
    mockUpdateStaffMember.mockRejectedValue(
      new ApiError('A clinic must retain at least one enabled administrator', 412),
    );
    render(<StaffEditModal onHide={mockOnHide} staffMember={staffMember} />);

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(
      await screen.findByText(
        'A clinic must retain at least one enabled administrator',
      ),
    ).toBeTruthy();
    expect(mockOnHide).not.toHaveBeenCalled();
  });
});
