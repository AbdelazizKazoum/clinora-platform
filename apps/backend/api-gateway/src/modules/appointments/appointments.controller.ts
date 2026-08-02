import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import type {
  AppointmentReply,
  AppointmentsListReply,
  ConflictReply,
} from '@clinora/contracts-appointment';
import { CurrentUser } from '@common/auth/decorators/current-user.decorator';
import { Roles } from '@common/auth/decorators/roles.decorator';
import { ClinicScopeGuard } from '@common/auth/guards/clinic-scope.guard';
import { JwtAuthGuard } from '@common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/auth/guards/roles.guard';
import type { JwtPayload } from '@common/auth/jwt-payload';

import {
  CheckAppointmentConflictsQueryDto,
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  UpdateAppointmentDto,
  UpdateAppointmentTimingDto,
} from './dto/appointment.dto';
import { AppointmentsFacade } from './appointments.facade';

@Controller('clinics/:clinicId/appointments')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicScopeGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsFacade) {}

  @Get()
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  listAppointments(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListAppointmentsQueryDto,
  ): Promise<AppointmentsListReply> {
    return this.appointments.listAppointments({ clinicId, ...query });
  }

  @Post()
  @Roles('admin', 'doctor', 'secretary')
  createAppointment(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentReply> {
    return this.appointments.createAppointment({
      clinicId,
      ...input,
      isEmergency: input.isEmergency ?? false,
      channel: input.channel ?? 'PHONE',
      createdBy: user.user_id,
    });
  }

  @Get('conflicts')
  @Roles('admin', 'doctor', 'secretary')
  checkConflicts(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: CheckAppointmentConflictsQueryDto,
  ): Promise<ConflictReply> {
    return this.appointments.checkAppointmentConflicts({ clinicId, ...query });
  }

  @Get(':appointmentId')
  @Roles('admin', 'doctor', 'secretary', 'dental_assistant')
  getAppointment(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ): Promise<AppointmentReply> {
    return this.appointments.getAppointment(clinicId, appointmentId);
  }

  @Put(':appointmentId')
  @Roles('admin', 'doctor', 'secretary')
  updateAppointment(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: UpdateAppointmentDto,
  ): Promise<AppointmentReply> {
    return this.appointments.updateAppointment(clinicId, {
      appointmentId,
      ...input,
    });
  }

  @Patch(':appointmentId/timing')
  @Roles('admin', 'doctor', 'secretary')
  updateAppointmentTiming(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: UpdateAppointmentTimingDto,
  ): Promise<AppointmentReply> {
    return this.appointments.updateAppointmentTiming(clinicId, {
      appointmentId,
      ...input,
    });
  }
}
