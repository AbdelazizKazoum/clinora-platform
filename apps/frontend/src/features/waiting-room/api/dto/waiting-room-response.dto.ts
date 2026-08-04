import type {
  QueuePriority,
  QueueStatus,
  WaitingRoomOrderingMode,
} from '../../model/waiting-room';

export interface WaitingRoomEntryResponseDto {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  status: QueueStatus;
  priority: QueuePriority;
  queueNotes: string;
  chairId: string;
  chairName: string;
  manualOrder?: number;
  arrivedAt: string;
  calledAt: string;
  seatedAt: string;
  completedAt: string;
  updatedAt: string;
}

export interface WaitingRoomChairResponseDto {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  isActive: boolean;
  isAvailable: boolean;
  occupiedByEntryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaitingRoomOrderingResponseDto {
  mode: WaitingRoomOrderingMode;
  manualStatuses: QueueStatus[];
}

export interface WaitingRoomStateResponseDto {
  entries: WaitingRoomEntryResponseDto[];
  chairs: WaitingRoomChairResponseDto[];
  ordering: WaitingRoomOrderingResponseDto;
  generatedAt: string;
}

export interface WaitingRoomChairsListResponseDto {
  chairs: WaitingRoomChairResponseDto[];
}
