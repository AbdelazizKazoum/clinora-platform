import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import { useNotificationStore } from '@/store';

import type { StaffMember } from '../model';
import StaffPage from './staff-page';
import { useStaffMembers, useUpdateStaffMember } from '../hooks';

jest.mock('@/components/PageBreadcrumb', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../hooks', () => ({
  useStaffMembers: jest.fn(),
  useUpdateStaffMember: jest.fn(),
}));

jest.mock('../components/staff-edit-modal', () => ({
  __esModule: true,
  default: ({ staffMember }: { staffMember: StaffMember | null }) =>
    staffMember ? <div role="dialog">Editing {staffMember.fullName}</div> : null,
}));

jest.mock('@/store', () => ({
  useNotificationStore: jest.fn(),
}));

const clinicId = '10000000-0000-4000-8000-000000000001';
const mockShowNotification = jest.fn();
const mockRefetch = jest.fn();
const mockUpdateStaffMember = jest.fn();

const createSession = (role: 'admin' | 'doctor' = 'admin'): Session => ({
  expires: '2026-07-31T00:00:00.000Z',
  user: {
    id: 'user-1',
    clinicId,
    email: `${role}@clinora.test`,
    fullName: `${role} user`,
    role,
  },
});

const createStaffMember = (
  overrides: Partial<StaffMember> = {},
): StaffMember => ({
  id: 'staff-1',
  clinicId,
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

const arrangeStaffPage = ({
  role = 'admin',
  staffMembers = [createStaffMember()],
  sessionStatus = 'authenticated',
  isError = false,
  isLoading = false,
  error = new Error('Unable to load staff members.'),
}: {
  role?: 'admin' | 'doctor';
  staffMembers?: StaffMember[];
  sessionStatus?: 'authenticated' | 'loading';
  isError?: boolean;
  isLoading?: boolean;
  error?: Error;
} = {}) => {
  jest.mocked(useSession).mockReturnValue({
    data: sessionStatus === 'authenticated' ? createSession(role) : null,
    status: sessionStatus,
    update: jest.fn(),
  });
  jest.mocked(useStaffMembers).mockReturnValue({
    data: staffMembers,
    error,
    isError,
    isFetching: false,
    isLoading,
    refetch: mockRefetch,
  } as ReturnType<typeof useStaffMembers>);
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

describe(StaffPage.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateStaffMember.mockResolvedValue(createStaffMember());
  });

  it('renders loading skeletons without showing empty copy', () => {
    arrangeStaffPage({ isLoading: true, sessionStatus: 'loading', staffMembers: [] });

    const { container } = render(<StaffPage />);

    expect(screen.getByRole('heading', { name: 'Staff Management' })).toBeTruthy();
    expect(screen.queryByText('No staff members yet')).toBeNull();
    expect(container.querySelectorAll('.placeholder').length).toBeGreaterThan(0);
  });

  it('renders the initial empty state', () => {
    arrangeStaffPage({ staffMembers: [] });

    render(<StaffPage />);

    expect(screen.getByText('No staff members yet')).toBeTruthy();
    expect(screen.getByText(/Add the first team member/)).toBeTruthy();
  });

  it('renders error and retry states', () => {
    arrangeStaffPage({
      error: new Error('Clinic service unavailable'),
      isError: true,
      staffMembers: [],
    });

    render(<StaffPage />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByText('Clinic service unavailable')).toBeTruthy();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('hides staff management actions from non-admin sessions', () => {
    arrangeStaffPage({ role: 'doctor' });

    render(<StaffPage />);

    expect(screen.queryByRole('button', { name: /manage salma/i })).toBeNull();
  });

  it('uses the synchronized update command for deactivation after confirmation', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    arrangeStaffPage();

    render(<StaffPage />);
    fireEvent.click(screen.getByRole('button', { name: /manage salma/i }));
    fireEvent.click(screen.getByText('Deactivate Account'));

    await waitFor(() => {
      expect(mockUpdateStaffMember).toHaveBeenCalledWith({
        clinicId,
        staffMemberId: 'staff-1',
        status: 'inactive',
      });
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Staff status updated',
        variant: 'success',
      }),
    );

    confirmSpy.mockRestore();
  });

  it('opens the edit workflow from the staff actions dropdown', () => {
    arrangeStaffPage();

    render(<StaffPage />);
    fireEvent.click(screen.getByRole('button', { name: /manage salma/i }));
    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByRole('dialog').textContent).toContain(
      'Editing Salma El Mansouri',
    );
  });
});
