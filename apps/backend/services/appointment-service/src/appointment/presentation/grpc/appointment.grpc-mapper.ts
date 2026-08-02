import type {
  AppointmentReply,
  QueueEntryReply,
} from "@clinora/contracts-appointment";
import {Appointment} from "../../domain/entities/appointment";
import {QueueEntry} from "../../domain/entities/queue-entry";

export class AppointmentGrpcMapper {
  static toAppointmentReply(
    appointment: Appointment,
  ): AppointmentReply {
    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone ?? "",
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      isEmergency: appointment.isEmergency,
      type: appointment.type ?? "",
      channel: appointment.channel,
      status: appointment.status,
      notes: appointment.notes ?? "",
      cancelledAt: appointment.cancelledAt?.toISOString() ?? "",
      cancellationReason: appointment.cancellationReason ?? "",
      createdBy: appointment.createdBy ?? "",
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
      patientPhone: entry.patientPhone ?? "",
      doctorId: entry.doctorId,
      doctorName: entry.doctorName,
      appointmentType: entry.appointmentType ?? "",
      status: entry.status,
      priority: entry.priority,
      queueNotes: entry.notes ?? "",
      arrivedAt: entry.arrivedAt.toISOString(),
      calledAt: entry.calledAt?.toISOString() ?? "",
      seatedAt: entry.seatedAt?.toISOString() ?? "",
      completedAt: entry.completedAt?.toISOString() ?? "",
      updatedAt: entry.updatedAt.toISOString(),
    };
  }
}
