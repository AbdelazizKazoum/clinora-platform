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
  WaitingRoomChairReply,
  WaitingRoomChairsListReply,
  WaitingRoomStateReply,
} from '@clinora/contracts-appointment';
import { Roles } from '@common/auth/decorators/roles.decorator';
import { ClinicScopeGuard } from '@common/auth/guards/clinic-scope.guard';
import { JwtAuthGuard } from '@common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/auth/guards/roles.guard';

import {
  AssignWaitingRoomChairDto,
  CreateWaitingRoomChairDto,
  ReorderWaitingRoomDto,
  UpdateWaitingRoomChairDto,
  UpdateWaitingRoomNotesDto,
  UpdateWaitingRoomStatusDto,
} from './dto/waiting-room.dto';
import { WaitingRoomFacade } from './waiting-room.facade';

@Controller('clinics/:clinicId/waiting-room')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicScopeGuard)
export class WaitingRoomController {
  constructor(private readonly waitingRoom: WaitingRoomFacade) {}

  @Get()
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  getWaitingRoomState(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<WaitingRoomStateReply> {
    return this.waitingRoom.getState(clinicId);
  }

  @Patch('entries/:entryId/status')
  @Roles('admin', 'secretary', 'dental_assistant')
  updateWaitingRoomStatus(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() input: UpdateWaitingRoomStatusDto,
  ): Promise<QueueEntryReply> {
    return this.waitingRoom.updateStatus({
      clinicId,
      queueEntryId: entryId,
      ...input,
    });
  }

  @Patch('entries/:entryId/notes')
  @Roles('admin', 'secretary', 'dental_assistant')
  updateWaitingRoomNotes(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() input: UpdateWaitingRoomNotesDto,
  ): Promise<QueueEntryReply> {
    return this.waitingRoom.updateNotes(clinicId, {
      queueEntryId: entryId,
      queueNotes: input.queueNotes,
    });
  }

  @Patch('entries/:entryId/chair')
  @Roles('admin', 'secretary', 'dental_assistant')
  assignWaitingRoomChair(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() input: AssignWaitingRoomChairDto,
  ): Promise<QueueEntryReply> {
    return this.waitingRoom.assignChair({
      clinicId,
      queueEntryId: entryId,
      chairId: input.chairId,
    });
  }

  @Patch('reorder')
  @Roles('admin', 'secretary', 'dental_assistant')
  reorderWaitingRoomEntries(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: ReorderWaitingRoomDto,
  ): Promise<QueueEntriesListReply> {
    return this.waitingRoom.reorderEntries({
      clinicId,
      ...input,
    });
  }

  @Get('chairs')
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  listWaitingRoomChairs(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<WaitingRoomChairsListReply> {
    return this.waitingRoom.listChairs(clinicId);
  }

  @Post('chairs')
  @Roles('admin', 'secretary')
  createWaitingRoomChair(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreateWaitingRoomChairDto,
  ): Promise<WaitingRoomChairReply> {
    return this.waitingRoom.createChair({
      clinicId,
      ...input,
    });
  }

  @Patch('chairs/:chairId')
  @Roles('admin', 'secretary')
  updateWaitingRoomChair(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('chairId', ParseUUIDPipe) chairId: string,
    @Body() input: UpdateWaitingRoomChairDto,
  ): Promise<WaitingRoomChairReply> {
    return this.waitingRoom.updateChair({
      clinicId,
      chairId,
      ...input,
    });
  }
}
