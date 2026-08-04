import type {
  QueueStatus,
  WaitingRoomOrderingMode,
} from '../../model/waiting-room';

export interface UpdateWaitingRoomStatusRequestDto {
  status: QueueStatus;
  chairId?: string;
  correctionReason?: string;
  targetOrderedEntryIds?: string[];
}

export interface UpdateWaitingRoomNotesRequestDto {
  queueNotes?: string;
}

export interface AssignWaitingRoomChairRequestDto {
  chairId: string;
}

export interface ReorderWaitingRoomRequestDto {
  mode: WaitingRoomOrderingMode;
  status?: QueueStatus;
  orderedEntryIds?: string[];
}

export interface CreateWaitingRoomChairRequestDto {
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateWaitingRoomChairRequestDto {
  name?: string;
  code?: string;
  isActive?: boolean;
}
