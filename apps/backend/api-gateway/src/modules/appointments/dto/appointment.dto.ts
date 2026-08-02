import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  APPOINTMENT_STATUSES,
  BOOKING_CHANNELS,
  type AppointmentStatus,
  type BookingChannel,
} from '@clinora/contracts-appointment';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  patientName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  patientPhone?: string;

  @IsUUID()
  doctorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  doctorName!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsIn(BOOKING_CHANNELS)
  channel?: BookingChannel;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  patientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  patientPhone?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  doctorName?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsIn(BOOKING_CHANNELS)
  channel?: BookingChannel;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  cancelledAt?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UpdateAppointmentTimingDto {
  @IsUUID()
  doctorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  doctorName?: string;

  @IsDateString()
  newStartAt!: string;

  @IsDateString()
  newEndAt!: string;
}

export class ListAppointmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: AppointmentStatus;
}

export class CheckAppointmentConflictsQueryDto {
  @IsUUID()
  doctorId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  excludeStatus?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  excludeAppointmentId?: string;
}
