import type { QueueStatus, WaitingRoomOrderingMode } from './waiting-room';

export interface UpdateWaitingRoomStatusCommand {
  clinicId: string;
  entryId: string;
  status: QueueStatus;
  chairId?: string | null;
  correctionReason?: string | null;
  targetOrderedEntryIds?: string[];
}

export interface UpdateWaitingRoomNotesCommand {
  clinicId: string;
  entryId: string;
  queueNotes?: string | null;
}

export interface AssignWaitingRoomChairCommand {
  clinicId: string;
  entryId: string;
  chairId: string;
}

export interface ReorderWaitingRoomCommand {
  clinicId: string;
  mode: WaitingRoomOrderingMode;
  status?: QueueStatus;
  orderedEntryIds?: string[];
}

export interface CreateWaitingRoomChairCommand {
  clinicId: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
}

export interface UpdateWaitingRoomChairCommand {
  clinicId: string;
  chairId: string;
  name?: string;
  code?: string | null;
  isActive?: boolean;
}
