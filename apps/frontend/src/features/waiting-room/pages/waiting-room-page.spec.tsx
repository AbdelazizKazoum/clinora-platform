import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { DropResult } from '@hello-pangea/dnd';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import { useNotificationStore } from '@/store';

import {
  useReorderWaitingRoomEntries,
  useUpdateWaitingRoomStatus,
  useWaitingRoomEvents,
  useWaitingRoomState,
} from '../hooks';
import type { WaitingRoomEntry, WaitingRoomState } from '../model';
import WaitingRoomPage from './waiting-room-page';

jest.mock('@/components/PageBreadcrumb', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

jest.mock('@/components/wrappers/SimpleBar', () => ({
  SimpleBar: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let mockDragEndHandler: ((result: DropResult) => void) | undefined;

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (result: DropResult) => void;
  }) => {
    mockDragEndHandler = onDragEnd;
    return <>{children}</>;
  },
  Draggable: ({
    children,
  }: {
    children: (provided: never, snapshot: never) => React.ReactNode;
  }) =>
    children(
      {
        dragHandleProps: {},
        draggableProps: {},
        innerRef: jest.fn(),
      } as never,
      { isDragging: false } as never,
    ),
  Droppable: ({
    children,
  }: {
    children: (provided: never, snapshot: never) => React.ReactNode;
  }) =>
    children(
      {
        droppableProps: {},
        innerRef: jest.fn(),
        placeholder: null,
      } as never,
      { isDraggingOver: false } as never,
    ),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../hooks', () => ({
  useReorderWaitingRoomEntries: jest.fn(),
  useUpdateWaitingRoomStatus: jest.fn(),
  useWaitingRoomEvents: jest.fn(),
  useWaitingRoomState: jest.fn(),
}));

jest.mock('@/store', () => ({
  useNotificationStore: jest.fn(),
}));

const clinicId = '10000000-0000-4000-8000-000000000001';
const refetch = jest.fn();
const reorderWaitingRoomEntries = jest.fn();
const updateWaitingRoomStatus = jest.fn();
const showNotification = jest.fn();

const session: Session = {
  expires: '2026-08-06T00:00:00.000Z',
  user: {
    id: 'user-1',
    clinicId,
    email: 'reception@clinora.test',
    fullName: 'Reception User',
    role: 'secretary',
  },
};

const createEntry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'entry-1',
  clinicId,
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '+212600000001',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Karim Alaoui',
  appointmentType: 'Consultation',
  status: 'WAITING',
  priority: 'URGENT',
  queueNotes: 'First visit',
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: new Date('2026-08-05T08:00:00.000Z'),
  calledAt: new Date('2026-08-05T08:05:00.000Z'),
  seatedAt: null,
  completedAt: null,
  updatedAt: new Date('2026-08-05T08:05:00.000Z'),
  ...overrides,
});

const createState = (entries: WaitingRoomEntry[]): WaitingRoomState => ({
  entries,
  chairs: [],
  ordering: { mode: 'AUTO', manualStatuses: [] },
  generatedAt: new Date('2026-08-05T08:10:00.000Z'),
});

const arrangePage = (
  options: {
    data?: WaitingRoomState | undefined;
    error?: Error;
    isError?: boolean;
    isLoading?: boolean;
    sessionStatus?: 'authenticated' | 'loading';
  } = {},
) => {
  const data = Object.prototype.hasOwnProperty.call(options, 'data')
    ? options.data
    : createState([createEntry()]);
  const {
    error = new Error('Waiting room unavailable'),
    isError = false,
    isLoading = false,
    sessionStatus = 'authenticated',
  } = options;
  jest.mocked(useSession).mockReturnValue({
    data: sessionStatus === 'authenticated' ? session : null,
    status: sessionStatus,
    update: jest.fn(),
  });
  jest.mocked(useWaitingRoomState).mockReturnValue({
    data,
    error,
    isError,
    isFetching: false,
    isLoading,
    refetch,
  } as ReturnType<typeof useWaitingRoomState>);
  jest.mocked(useReorderWaitingRoomEntries).mockReturnValue({
    error: null,
    isPending: false,
    reorderWaitingRoomEntries,
    reset: jest.fn(),
  });
  jest.mocked(useUpdateWaitingRoomStatus).mockReturnValue({
    error: null,
    isPending: false,
    reset: jest.fn(),
    updateWaitingRoomStatus,
  });
  jest
    .mocked(useNotificationStore)
    .mockImplementation((selector) => selector({ showNotification } as never));
};

const finishDrag = (
  result: Pick<DropResult, 'destination' | 'draggableId' | 'source'>,
) => {
  act(() => {
    mockDragEndHandler?.(result as DropResult);
  });
};

describe(WaitingRoomPage.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    refetch.mockResolvedValue({ isError: false });
    reorderWaitingRoomEntries.mockResolvedValue([]);
    updateWaitingRoomStatus.mockResolvedValue(createEntry());
  });

  it('renders a loading board without empty-state copy', () => {
    arrangePage({ data: undefined, isLoading: true, sessionStatus: 'loading' });

    const { container } = render(<WaitingRoomPage />);

    expect(screen.getByRole('heading', { name: 'Waiting Room' })).toBeTruthy();
    expect(screen.queryByText('The queue is clear')).toBeNull();
    expect(container.querySelectorAll('.placeholder').length).toBeGreaterThan(
      0,
    );
  });

  it('renders the live queue from waiting-room state and starts the stream', () => {
    arrangePage({
      data: createState([
        createEntry({
          id: 'arrived',
          patientName: 'Sara Amrani',
          status: 'ARRIVED',
        }),
        createEntry({ id: 'waiting', patientName: 'Youssef Idrissi' }),
        createEntry({
          id: 'seated',
          patientName: 'Mina Farah',
          status: 'IN_CHAIR',
        }),
        createEntry({ id: 'done', patientName: 'Omar Tazi', status: 'DONE' }),
      ]),
    });

    render(<WaitingRoomPage />);

    expect(screen.getByText('Sara Amrani')).toBeTruthy();
    expect(screen.getByText('Youssef Idrissi')).toBeTruthy();
    expect(screen.getByText('Mina Farah')).toBeTruthy();
    expect(screen.getByText('Omar Tazi')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Auto Reorder' })).toBeTruthy();
    expect(useWaitingRoomEvents).toHaveBeenCalledWith(clinicId);
  });

  it('distinguishes the initial empty state from a filtered-empty board', () => {
    arrangePage();

    const { rerender } = render(<WaitingRoomPage />);
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search waiting room' }),
      {
        target: { value: 'No matching patient' },
      },
    );

    expect(screen.getByText('No patients match these filters')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('Sara Amrani')).toBeTruthy();

    arrangePage({ data: createState([]) });
    rerender(<WaitingRoomPage />);
    expect(screen.getByText('The queue is clear')).toBeTruthy();
  });

  it('renders an error with retry support', () => {
    arrangePage({ data: undefined, isError: true });

    render(<WaitingRoomPage />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByText('Waiting room unavailable')).toBeTruthy();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('enables manual ordering and persists same-column movement', async () => {
    arrangePage({
      data: createState([
        createEntry({ id: 'entry-1', patientName: 'First Patient' }),
        createEntry({ id: 'entry-2', patientName: 'Second Patient' }),
      ]),
    });
    render(<WaitingRoomPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Manual Order' }));
    finishDrag({
      destination: { droppableId: 'WAITING', index: 0 },
      draggableId: 'entry-2',
      source: { droppableId: 'WAITING', index: 1 },
    });

    await waitFor(() => {
      expect(reorderWaitingRoomEntries).toHaveBeenCalledWith({
        clinicId,
        mode: 'MANUAL',
        orderedEntryIds: ['entry-2', 'entry-1'],
        status: 'WAITING',
      });
    });
  });

  it('blocks seating without a chair before submitting a status move', () => {
    arrangePage();
    render(<WaitingRoomPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Manual Order' }));
    finishDrag({
      destination: { droppableId: 'IN_CHAIR', index: 0 },
      draggableId: 'entry-1',
      source: { droppableId: 'WAITING', index: 0 },
    });

    expect(updateWaitingRoomStatus).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Chair required', variant: 'warning' }),
    );
  });

  it('persists forward movement with complete destination ordering', async () => {
    arrangePage({
      data: createState([
        createEntry({
          id: 'arrived',
          patientName: 'Arrived Patient',
          status: 'ARRIVED',
        }),
        createEntry({ id: 'waiting', patientName: 'Waiting Patient' }),
      ]),
    });
    render(<WaitingRoomPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Manual Order' }));
    finishDrag({
      destination: { droppableId: 'WAITING', index: 1 },
      draggableId: 'arrived',
      source: { droppableId: 'ARRIVED', index: 0 },
    });

    await waitFor(() => {
      expect(updateWaitingRoomStatus).toHaveBeenCalledWith({
        chairId: undefined,
        clinicId,
        correctionReason: undefined,
        entryId: 'arrived',
        status: 'WAITING',
        targetOrderedEntryIds: ['waiting', 'arrived'],
      });
    });
  });

  it('requires and submits a correction reason for backward movement', async () => {
    arrangePage({
      data: createState([
        createEntry({ id: 'waiting', patientName: 'Waiting Patient' }),
        createEntry({
          id: 'done',
          patientName: 'Completed Patient',
          status: 'DONE',
        }),
      ]),
    });
    render(<WaitingRoomPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Manual Order' }));
    finishDrag({
      destination: { droppableId: 'WAITING', index: 1 },
      draggableId: 'done',
      source: { droppableId: 'DONE', index: 0 },
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(updateWaitingRoomStatus).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Correction reason'), {
      target: { value: 'Patient was marked complete by mistake' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm correction' }));

    await waitFor(() => {
      expect(updateWaitingRoomStatus).toHaveBeenCalledWith({
        chairId: undefined,
        clinicId,
        correctionReason: 'Patient was marked complete by mistake',
        entryId: 'done',
        status: 'WAITING',
        targetOrderedEntryIds: ['waiting', 'done'],
      });
    });
  });

  it('restores automatic ordering through the backend command', async () => {
    arrangePage({
      data: {
        ...createState([createEntry({ manualOrder: 1 })]),
        ordering: { mode: 'MANUAL', manualStatuses: ['WAITING'] },
      },
    });
    render(<WaitingRoomPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Auto Reorder' }));

    await waitFor(() => {
      expect(reorderWaitingRoomEntries).toHaveBeenCalledWith({
        clinicId,
        mode: 'AUTO',
      });
    });
  });
});
