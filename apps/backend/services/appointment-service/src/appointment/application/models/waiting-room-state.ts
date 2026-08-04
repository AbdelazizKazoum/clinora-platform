import { Chair } from '../../domain/entities/chair';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueueStatus } from '../../domain/enums/queue-status.enum';

export interface WaitingRoomChairState {
  chair: Chair;
  isAvailable: boolean;
  occupiedByEntryId: string | null;
}

export interface WaitingRoomOrderingState {
  mode: 'AUTO' | 'MANUAL';
  manualStatuses: QueueStatus[];
}

export interface WaitingRoomState {
  entries: QueueEntry[];
  chairs: WaitingRoomChairState[];
  ordering: WaitingRoomOrderingState;
  generatedAt: Date;
}
