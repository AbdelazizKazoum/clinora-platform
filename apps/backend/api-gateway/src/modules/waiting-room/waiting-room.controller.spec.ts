import type { QueueStatus } from '@clinora/contracts-appointment';

import type { WaitingRoomFacade } from './waiting-room.facade';
import { WaitingRoomController } from './waiting-room.controller';

const clinicId = '10000000-0000-4000-8000-000000000001';
const entryId = '20000000-0000-4000-8000-000000000001';
const chairId = '30000000-0000-4000-8000-000000000001';
const waitingStatus: QueueStatus = 'WAITING';
const inChairStatus: QueueStatus = 'IN_CHAIR';

describe(WaitingRoomController.name, () => {
  const facade: jest.Mocked<
    Pick<
      WaitingRoomFacade,
      | 'getState'
      | 'updateStatus'
      | 'updateNotes'
      | 'assignChair'
      | 'reorderEntries'
      | 'listChairs'
      | 'createChair'
      | 'updateChair'
    >
  > = {
    getState: jest.fn(),
    updateStatus: jest.fn(),
    updateNotes: jest.fn(),
    assignChair: jest.fn(),
    reorderEntries: jest.fn(),
    listChairs: jest.fn(),
    createChair: jest.fn(),
    updateChair: jest.fn(),
  };

  const controller = new WaitingRoomController(
    facade as unknown as WaitingRoomFacade,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('delegates state and chair reads with the clinic path parameter', async () => {
    facade.getState.mockResolvedValue({
      entries: [],
      chairs: [],
      ordering: {
        mode: 'AUTO',
        manualStatuses: [],
      },
      generatedAt: '2026-08-04T08:00:00.000Z',
    });
    facade.listChairs.mockResolvedValue({ chairs: [] });

    await controller.getWaitingRoomState(clinicId);
    await controller.listWaitingRoomChairs(clinicId);

    expect(facade.getState).toHaveBeenCalledWith(clinicId);
    expect(facade.listChairs).toHaveBeenCalledWith(clinicId);
  });

  it('merges route params into the waiting-room status command', async () => {
    await controller.updateWaitingRoomStatus(clinicId, entryId, {
      status: inChairStatus,
      chairId,
      targetOrderedEntryIds: [entryId],
    });

    expect(facade.updateStatus).toHaveBeenCalledWith({
      clinicId,
      queueEntryId: entryId,
      status: inChairStatus,
      chairId,
      targetOrderedEntryIds: [entryId],
    });
  });

  it('delegates notes and chair assignment through waiting-room routes', async () => {
    await controller.updateWaitingRoomNotes(clinicId, entryId, {
      queueNotes: 'Patient prefers quiet room',
    });
    await controller.assignWaitingRoomChair(clinicId, entryId, { chairId });

    expect(facade.updateNotes).toHaveBeenCalledWith(clinicId, {
      queueEntryId: entryId,
      queueNotes: 'Patient prefers quiet room',
    });
    expect(facade.assignChair).toHaveBeenCalledWith({
      clinicId,
      queueEntryId: entryId,
      chairId,
    });
  });

  it('delegates reorder and chair management commands', async () => {
    await controller.reorderWaitingRoomEntries(clinicId, {
      mode: 'MANUAL',
      status: waitingStatus,
      orderedEntryIds: [entryId],
    });
    await controller.createWaitingRoomChair(clinicId, {
      name: 'Operatory 1',
      code: 'OP-1',
      isActive: true,
    });
    await controller.updateWaitingRoomChair(clinicId, chairId, {
      name: 'Operatory 1A',
      isActive: false,
    });

    expect(facade.reorderEntries).toHaveBeenCalledWith({
      clinicId,
      mode: 'MANUAL',
      status: waitingStatus,
      orderedEntryIds: [entryId],
    });
    expect(facade.createChair).toHaveBeenCalledWith({
      clinicId,
      name: 'Operatory 1',
      code: 'OP-1',
      isActive: true,
    });
    expect(facade.updateChair).toHaveBeenCalledWith({
      clinicId,
      chairId,
      name: 'Operatory 1A',
      isActive: false,
    });
  });
});
