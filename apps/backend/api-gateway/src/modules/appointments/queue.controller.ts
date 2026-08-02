import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type {
  QueueEntriesListReply,
  QueueEntryReply,
} from '@clinora/contracts-appointment';
import { Roles } from '@common/auth/decorators/roles.decorator';
import { ClinicScopeGuard } from '@common/auth/guards/clinic-scope.guard';
import { JwtAuthGuard } from '@common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/auth/guards/roles.guard';

import { AppointmentsFacade } from './appointments.facade';
import {
  CheckInPatientDto,
  UpdateQueueNotesDto,
  UpdateQueueStatusDto,
} from './dto/queue.dto';

@Controller('clinics/:clinicId/queue')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicScopeGuard)
export class QueueController {
  constructor(private readonly appointments: AppointmentsFacade) {}

  @Get()
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  listQueueEntries(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<QueueEntriesListReply> {
    return this.appointments.listQueueEntries({ clinicId });
  }

  @Post()
  @Roles('admin', 'secretary', 'dental_assistant')
  checkInPatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CheckInPatientDto,
  ): Promise<QueueEntryReply> {
    return this.appointments.checkInPatient({ clinicId, ...input });
  }

  @Get(':queueEntryId')
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  getQueueEntry(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('queueEntryId', ParseUUIDPipe) queueEntryId: string,
  ): Promise<QueueEntryReply> {
    return this.appointments.getQueueEntry(clinicId, queueEntryId);
  }

  @Patch(':queueEntryId/status')
  @Roles('admin', 'secretary', 'dental_assistant')
  updateQueueStatus(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('queueEntryId', ParseUUIDPipe) queueEntryId: string,
    @Body() input: UpdateQueueStatusDto,
  ): Promise<QueueEntryReply> {
    return this.appointments.updateQueueStatus(clinicId, {
      queueEntryId,
      ...input,
    });
  }

  @Patch(':queueEntryId/notes')
  @Roles('admin', 'secretary', 'dental_assistant')
  updateQueueNotes(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('queueEntryId', ParseUUIDPipe) queueEntryId: string,
    @Body() input: UpdateQueueNotesDto,
  ): Promise<QueueEntryReply> {
    return this.appointments.updateQueueNotes(clinicId, {
      queueEntryId,
      queueNotes: input.queueNotes,
    });
  }
}
