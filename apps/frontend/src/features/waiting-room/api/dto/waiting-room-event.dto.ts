import type { QueueStatus } from '../../model/waiting-room';

export type QueueStreamEventType =
  | 'queue.checked_in'
  | 'queue.status.updated'
  | 'queue.notes.updated'
  | 'queue.reordered'
  | 'queue.chair.assigned'
  | 'queue.chair.updated';

export interface QueueStreamEntryDto {
  id: string;
  clinic_id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  doctor_id: string;
  doctor_name: string;
  appointment_type?: string;
  status: QueueStatus;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  queue_notes?: string;
  chair_id?: string;
  chair_name?: string;
  manual_order?: number;
  arrived_at: string;
  called_at?: string;
  seated_at?: string;
  completed_at?: string;
  updated_at: string;
}

export interface QueueStreamChairDto {
  id: string;
  clinic_id: string;
  name: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueueStreamEventDto {
  type: QueueStreamEventType;
  clinic_id: string;
  entry?: QueueStreamEntryDto;
  entries?: QueueStreamEntryDto[];
  chair?: QueueStreamChairDto;
  status?: QueueStatus;
}
