import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  QUEUE_STATUSES,
  WAITING_ROOM_ORDERING_MODES,
  type QueueStatus,
  type WaitingRoomOrderingMode,
} from '@clinora/contracts-appointment';

export class UpdateWaitingRoomStatusDto {
  @IsIn(QUEUE_STATUSES)
  status!: QueueStatus;

  @IsOptional()
  @IsUUID()
  chairId?: string;

  @IsOptional()
  @IsString()
  correctionReason?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  targetOrderedEntryIds?: string[];
}

export class UpdateWaitingRoomNotesDto {
  @IsOptional()
  @IsString()
  queueNotes?: string;
}

export class AssignWaitingRoomChairDto {
  @IsUUID()
  chairId!: string;
}

export class ReorderWaitingRoomDto {
  @IsIn(WAITING_ROOM_ORDERING_MODES)
  mode!: WaitingRoomOrderingMode;

  @IsOptional()
  @IsIn(QUEUE_STATUSES)
  status?: QueueStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedEntryIds?: string[];
}

export class CreateWaitingRoomChairDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWaitingRoomChairDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
