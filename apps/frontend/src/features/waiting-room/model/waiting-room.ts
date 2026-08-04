export const QUEUE_PRIORITIES = ['NORMAL', 'URGENT', 'EMERGENCY'] as const;
export const QUEUE_STATUSES = [
  'ARRIVED',
  'WAITING',
  'IN_CHAIR',
  'DONE',
] as const;
export const WAITING_ROOM_ORDERING_MODES = ['AUTO', 'MANUAL'] as const;

export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];
export type QueueStatus = (typeof QUEUE_STATUSES)[number];
export type WaitingRoomOrderingMode =
  (typeof WAITING_ROOM_ORDERING_MODES)[number];

export interface WaitingRoomEntry {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  doctorId: string;
  doctorName: string;
  appointmentType: string | null;
  status: QueueStatus;
  priority: QueuePriority;
  queueNotes: string | null;
  chairId: string | null;
  chairName: string | null;
  manualOrder: number | null;
  arrivedAt: Date;
  calledAt: Date | null;
  seatedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface WaitingRoomChair {
  id: string;
  clinicId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  isAvailable: boolean;
  occupiedByEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingRoomOrdering {
  mode: WaitingRoomOrderingMode;
  manualStatuses: QueueStatus[];
}

export interface WaitingRoomState {
  entries: WaitingRoomEntry[];
  chairs: WaitingRoomChair[];
  ordering: WaitingRoomOrdering;
  generatedAt: Date;
}

export type QueueStreamEventType =
  | 'queue.checked_in'
  | 'queue.status.updated'
  | 'queue.notes.updated'
  | 'queue.reordered'
  | 'queue.chair.assigned'
  | 'queue.chair.updated';

export interface WaitingRoomQueueStreamEvent {
  type: QueueStreamEventType;
  clinicId: string;
  entry?: WaitingRoomEntry;
  entries?: WaitingRoomEntry[];
  chair?: WaitingRoomChair;
  status?: QueueStatus;
}

export const queueStatusLabels = {
  ARRIVED: 'Arrived',
  WAITING: 'Waiting',
  IN_CHAIR: 'In Chair',
  DONE: 'Done',
} satisfies Record<QueueStatus, string>;

export const queuePriorityLabels = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
} satisfies Record<QueuePriority, string>;

export const waitingRoomOrderingModeLabels = {
  AUTO: 'Auto',
  MANUAL: 'Manual',
} satisfies Record<WaitingRoomOrderingMode, string>;

export const queueStatusBadgeClassNames = {
  ARRIVED: 'badge-soft-info text-info',
  WAITING: 'badge-soft-warning text-warning',
  IN_CHAIR: 'badge-soft-primary text-primary',
  DONE: 'badge-soft-success text-success',
} satisfies Record<QueueStatus, string>;

export const queuePriorityBadgeClassNames = {
  NORMAL: 'badge-soft-secondary text-secondary',
  URGENT: 'badge-soft-warning text-warning',
  EMERGENCY: 'badge-soft-danger text-danger',
} satisfies Record<QueuePriority, string>;

export const chairAvailabilityBadgeClassNames = {
  available: 'badge-soft-success text-success',
  occupied: 'badge-soft-warning text-warning',
  inactive: 'badge-soft-secondary text-secondary',
} as const;
