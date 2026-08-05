import { fireEvent, render, screen } from '@testing-library/react';

import type { WaitingRoomChair, WaitingRoomEntry } from '../model';
import WaitingRoomChairAssignmentModal from './waiting-room-chair-assignment-modal';

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

const now = new Date('2026-08-05T08:00:00.000Z');

const chair = (
  overrides: Partial<WaitingRoomChair> = {},
): WaitingRoomChair => ({
  id: 'chair-1',
  clinicId: 'clinic-1',
  name: 'Operatory 1',
  code: 'OP-1',
  isActive: true,
  isAvailable: true,
  occupiedByEntryId: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const entry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'entry-1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Karim Alaoui',
  appointmentType: null,
  status: 'WAITING',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: now,
  calledAt: null,
  seatedAt: null,
  completedAt: null,
  updatedAt: now,
  ...overrides,
});

describe(WaitingRoomChairAssignmentModal.name, () => {
  it('shows available chairs by default and occupied chairs only on request', () => {
    const seatedEntry = entry({
      id: 'entry-2',
      patientName: 'Youssef Idrissi',
      status: 'IN_CHAIR',
    });

    render(
      <WaitingRoomChairAssignmentModal
        chairs={[
          chair(),
          chair({
            id: 'chair-2',
            name: 'Operatory 2',
            code: 'OP-2',
            isAvailable: false,
            occupiedByEntryId: 'entry-2',
          }),
          chair({
            id: 'chair-3',
            name: 'Operatory 3',
            code: 'OP-3',
            isActive: false,
            isAvailable: false,
          }),
        ]}
        entries={[entry(), seatedEntry]}
        entry={entry()}
        onHide={jest.fn()}
        onSubmit={jest.fn()}
        show
      />,
    );

    expect(
      (
        screen.getByRole('radio', {
          name: 'Select Operatory 1 (OP-1)',
        }) as HTMLInputElement
      ).disabled,
    ).toBe(false);
    expect(
      screen.queryByRole('radio', { name: 'Select Operatory 2 (OP-2)' }),
    ).toBeNull();
    expect(screen.queryByText('Operatory 3')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: /show occupied chairs/i }),
    );
    expect(
      (
        screen.getByRole('radio', {
          name: 'Select Operatory 2 (OP-2)',
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText('Occupied by Youssef Idrissi')).toBeTruthy();
  });

  it('requires an explicit selection and submits an available chair', () => {
    const onSubmit = jest.fn();

    render(
      <WaitingRoomChairAssignmentModal
        chairs={[chair()]}
        entries={[entry()]}
        entry={entry()}
        onHide={jest.fn()}
        onSubmit={onSubmit}
        show
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Seat patient' }));
    expect(
      screen.getByText(/select an available chair before seating/i),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('radio', { name: 'Select Operatory 1 (OP-1)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Seat patient' }));
    expect(onSubmit).toHaveBeenCalledWith('chair-1');
  });

  it('allows the current occupied chair when editing its own seated entry', () => {
    const seatedEntry = entry({
      chairId: 'chair-1',
      chairName: 'Operatory 1',
      status: 'IN_CHAIR',
    });

    render(
      <WaitingRoomChairAssignmentModal
        chairs={[
          chair({ isAvailable: false, occupiedByEntryId: seatedEntry.id }),
        ]}
        entries={[seatedEntry]}
        entry={seatedEntry}
        onHide={jest.fn()}
        onSubmit={jest.fn()}
        show
      />,
    );

    expect(
      (
        screen.getByRole('radio', {
          name: 'Select Operatory 1 (OP-1)',
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(screen.getByText('Current')).toBeTruthy();
  });
});
