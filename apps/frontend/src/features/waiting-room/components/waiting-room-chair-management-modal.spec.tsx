import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { WaitingRoomChair } from '../model';
import WaitingRoomChairManagementModal from './waiting-room-chair-management-modal';

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

describe(WaitingRoomChairManagementModal.name, () => {
  it('creates a normalized active chair', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);

    render(
      <WaitingRoomChairManagementModal
        chairs={[]}
        onCreate={onCreate}
        onHide={jest.fn()}
        onUpdate={jest.fn()}
        show
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add chair' }));
    fireEvent.change(screen.getByLabelText('Chair name'), {
      target: { value: '  Operatory 4  ' },
    });
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: '  OP-4  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create chair' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        code: 'OP-4',
        isActive: true,
        name: 'Operatory 4',
      });
    });
  });

  it('renames a chair and prevents deactivating an occupied chair', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const availableChair = chair();
    const occupiedChair = chair({
      id: 'chair-2',
      name: 'Operatory 2',
      code: 'OP-2',
      isAvailable: false,
      occupiedByEntryId: 'entry-2',
    });

    render(
      <WaitingRoomChairManagementModal
        chairs={[availableChair, occupiedChair]}
        onCreate={jest.fn()}
        onHide={jest.fn()}
        onUpdate={onUpdate}
        show
      />,
    );

    expect(
      (
        screen.getByTitle(
          /move or complete the seated patient/i,
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Operatory 1 (OP-1)' }),
    );
    fireEvent.change(screen.getByLabelText('Chair name'), {
      target: { value: 'Operatory 1A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save chair' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(availableChair, {
        code: 'OP-1',
        isActive: true,
        name: 'Operatory 1A',
      });
    });
  });

  it('activates an inactive chair from the management list', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const inactiveChair = chair({
      isActive: false,
      isAvailable: false,
    });

    render(
      <WaitingRoomChairManagementModal
        chairs={[inactiveChair]}
        onCreate={jest.fn()}
        onHide={jest.fn()}
        onUpdate={onUpdate}
        show
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(inactiveChair, {
        code: 'OP-1',
        isActive: true,
        name: 'Operatory 1',
      });
    });
  });
});
