import type {
  QueueStatus,
  WaitingRoomChair,
  WaitingRoomEntry,
} from './waiting-room';

export const waitingRoomStatusFlow = [
  'ARRIVED',
  'WAITING',
  'IN_CHAIR',
  'DONE',
] as const satisfies readonly QueueStatus[];

export const waitingRoomVisibleStatuses = waitingRoomStatusFlow;

export const getQueueStatusIndex = (status: QueueStatus): number =>
  waitingRoomStatusFlow.indexOf(status);

export const isBackwardQueueStatusMove = (
  currentStatus: QueueStatus,
  nextStatus: QueueStatus,
): boolean =>
  getQueueStatusIndex(nextStatus) < getQueueStatusIndex(currentStatus);

export const requiresQueueStatusCorrectionReason = (
  currentStatus: QueueStatus,
  nextStatus: QueueStatus,
): boolean => isBackwardQueueStatusMove(currentStatus, nextStatus);

export const isChairAssignable = (chair: WaitingRoomChair): boolean =>
  chair.isActive && chair.isAvailable;

export const isChairSelectableForEntry = (
  chair: WaitingRoomChair,
  entryId: string,
): boolean =>
  chair.isActive && (chair.isAvailable || chair.occupiedByEntryId === entryId);

export const getChairDisplayName = (chair: WaitingRoomChair): string =>
  chair.code ? `${chair.name} (${chair.code})` : chair.name;

export const getEntryChairLabel = (entry: WaitingRoomEntry): string | null =>
  entry.chairName ?? entry.chairId;

export const canLaunchTreatmentFromWaitingRoom = (
  entry: WaitingRoomEntry,
): boolean => entry.status === 'IN_CHAIR';
