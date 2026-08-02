import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import {
  QUEUE_PRIORITIES,
  QUEUE_STATUSES,
  type QueuePriority,
  type QueueStatus,
} from '@clinora/contracts-appointment';

export class CheckInPatientDto {
  @IsUUID()
  appointmentId!: string;

  @IsUUID()
  patientId!: string;

  @IsString()
  @MaxLength(255)
  patientName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  patientPhone?: string;

  @IsUUID()
  doctorId!: string;

  @IsString()
  @MaxLength(255)
  doctorName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  appointmentType?: string;

  @IsOptional()
  @IsIn(QUEUE_PRIORITIES)
  priority?: QueuePriority;

  @IsOptional()
  @IsString()
  queueNotes?: string;

  @IsOptional()
  @IsDateString()
  arrivedAt?: string;
}

export class UpdateQueueStatusDto {
  @IsIn(QUEUE_STATUSES)
  status!: QueueStatus;

  @IsOptional()
  @IsString()
  correctionReason?: string;
}

export class UpdateQueueNotesDto {
  @IsOptional()
  @IsString()
  queueNotes?: string;
}
