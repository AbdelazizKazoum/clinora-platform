import type {
  AppointmentReply,
  QueueEntryReply,
  WaitingRoomChairReply,
  WaitingRoomStateReply,
} from '@clinora/contracts-appointment';
import { Chair } from '../../domain/entities/chair';
import { Appointment } from '../../domain/entities/appointment';
import { QueueEntry } from '../../domain/entities/queue-entry';
import {
  WaitingRoomChairState,
  WaitingRoomState,
} from '../../application/models/waiting-room-state';

export class AppointmentGrpcMapper {
  static toAppointmentReply(appointment: Appointment): AppointmentReply {
    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone ?? '',
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      isEmergency: appointment.isEmergency,
      type: appointment.type ?? '',
      channel: appointment.channel,
      status: appointment.status,
      notes: appointment.notes ?? '',
      cancelledAt: appointment.cancelledAt?.toISOString() ?? '',
      cancellationReason: appointment.cancellationReason ?? '',
      createdBy: appointment.createdBy ?? '',
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  static toQueueEntryReply(entry: QueueEntry): QueueEntryReply {
    return {
      id: entry.id,
      clinicId: entry.clinicId,
      appointmentId: entry.appointmentId,
      patientId: entry.patientId,
      patientName: entry.patientName,
      patientPhone: entry.patientPhone ?? '',
      doctorId: entry.doctorId,
      doctorName: entry.doctorName,
      appointmentType: entry.appointmentType ?? '',
      status: entry.status,
      priority: entry.priority,
      queueNotes: entry.notes ?? '',
      arrivedAt: entry.arrivedAt.toISOString(),
      calledAt: entry.calledAt?.toISOString() ?? '',
      seatedAt: entry.seatedAt?.toISOString() ?? '',
      completedAt: entry.completedAt?.toISOString() ?? '',
      updatedAt: entry.updatedAt.toISOString(),
      chairId: entry.chairId ?? '',
      chairName: entry.chairName ?? '',
      manualOrder: entry.manualOrder ?? undefined,
    };
  }

  static toWaitingRoomStateReply(
    state: WaitingRoomState,
  ): WaitingRoomStateReply {
    return {
      entries: state.entries.map(AppointmentGrpcMapper.toQueueEntryReply),
      chairs: state.chairs.map(AppointmentGrpcMapper.toWaitingRoomChairReply),
      ordering: {
        mode: state.ordering.mode,
        manualStatuses: state.ordering.manualStatuses,
      },
      generatedAt: state.generatedAt.toISOString(),
    };
  }

  static toWaitingRoomChairReply(
    state: WaitingRoomChairState,
  ): WaitingRoomChairReply {
    return AppointmentGrpcMapper.toChairReply(state.chair, {
      isAvailable: state.isAvailable,
      occupiedByEntryId: state.occupiedByEntryId,
    });
  }

  static toWaitingRoomChairReplyFromChair(chair: Chair): WaitingRoomChairReply {
    return AppointmentGrpcMapper.toChairReply(chair, {
      isAvailable: chair.isAssignable,
      occupiedByEntryId: null,
    });
  }

  private static toChairReply(
    chair: Chair,
    availability: {
      isAvailable: boolean;
      occupiedByEntryId: string | null;
    },
  ): WaitingRoomChairReply {
    return {
      id: chair.id,
      clinicId: chair.clinicId,
      name: chair.name,
      code: chair.code,
      isActive: chair.isActive,
      isAvailable: availability.isAvailable,
      occupiedByEntryId: availability.occupiedByEntryId ?? '',
      createdAt: chair.properties.createdAt.toISOString(),
      updatedAt: chair.properties.updatedAt.toISOString(),
    };
  }
}
