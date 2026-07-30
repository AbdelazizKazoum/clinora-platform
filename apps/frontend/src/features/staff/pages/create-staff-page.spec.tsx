import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';

import { useCreateStaffMember } from '../hooks';
import CreateStaffPage from './create-staff-page';

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

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../hooks', () => ({
  useCreateStaffMember: jest.fn(),
}));

jest.mock('@/store', () => ({
  useNotificationStore: jest.fn(),
}));

const clinicId = '10000000-0000-4000-8000-000000000001';
const mockCreateStaffMember = jest.fn();
const mockShowNotification = jest.fn();

const session: Session = {
  expires: '2026-07-31T00:00:00.000Z',
  user: {
    id: 'user-1',
    clinicId,
    email: 'admin@clinora.test',
    fullName: 'Admin User',
    role: 'admin',
  },
};

const arrangeCreatePage = ({
  isPending = false,
  resolvedClinicId = clinicId,
}: {
  isPending?: boolean;
  resolvedClinicId?: string | undefined;
} = {}) => {
  jest.mocked(useSession).mockReturnValue({
    data: {
      ...session,
      user: {
        ...session.user,
        clinicId: resolvedClinicId ?? '',
      },
    },
    status: 'authenticated',
    update: jest.fn(),
  });
  jest.mocked(useCreateStaffMember).mockReturnValue({
    createStaffMember: mockCreateStaffMember,
    error: null,
    isPending,
    reset: jest.fn(),
  });
  jest
    .mocked(useNotificationStore)
    .mockImplementation((selector) =>
      selector({ showNotification: mockShowNotification }),
    );
};

const fillValidCreateForm = () => {
  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: 'Salma' },
  });
  fireEvent.change(screen.getByLabelText(/last name/i), {
    target: { value: 'El Mansouri' },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'SALMA.ELMANSOURI@CLINORA.TEST' },
  });
  fireEvent.change(screen.getByLabelText(/^password/i), {
    target: { value: 'StrongPassword123!' },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: 'StrongPassword123!' },
  });
};

describe(CreateStaffPage.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateStaffMember.mockResolvedValue({
      id: 'staff-1',
      clinicId,
    });
  });

  it('submits a create command without password confirmation and returns to staff', async () => {
    arrangeCreatePage();
    render(<CreateStaffPage />);

    fillValidCreateForm();
    fireEvent.click(screen.getByRole('button', { name: /create staff member/i }));

    await waitFor(() => {
      expect(mockCreateStaffMember).toHaveBeenCalledWith({
        clinicId,
        role: 'DOCTOR',
        firstName: 'Salma',
        lastName: 'El Mansouri',
        email: 'salma.elmansouri@clinora.test',
        password: 'StrongPassword123!',
      });
    });
    expect(mockCreateStaffMember.mock.calls[0][0]).not.toHaveProperty(
      'passwordConfirmation',
    );
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Staff member created',
        variant: 'success',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/staff');
  });

  it('maps duplicate email conflicts to useful field feedback', async () => {
    arrangeCreatePage();
    mockCreateStaffMember.mockRejectedValue(
      new ApiError('duplicate email', 409),
    );
    render(<CreateStaffPage />);

    fillValidCreateForm();
    fireEvent.click(screen.getByRole('button', { name: /create staff member/i }));

    expect(
      await screen.findByText('A staff member with this email already exists.'),
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps specialization optional for doctor creation', () => {
    arrangeCreatePage();
    render(<CreateStaffPage />);

    expect(screen.getByLabelText(/^specialization$/i)).toBeTruthy();
    expect(screen.queryByText('Doctor specialization is required.')).toBeNull();
  });

  it('prevents submission when clinic context is missing', () => {
    arrangeCreatePage({ resolvedClinicId: '' });
    render(<CreateStaffPage />);

    expect(
      screen.getByRole('button', { name: /create staff member/i }),
    ).toHaveProperty('disabled', true);
    expect(
      screen.getByText(/session is missing a clinic context/i),
    ).toBeTruthy();
  });
});
