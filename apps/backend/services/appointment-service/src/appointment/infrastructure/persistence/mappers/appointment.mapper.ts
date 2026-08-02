import {Appointment} from "../../../domain/entities/appointment";
import {AppointmentTypeOrmEntity} from "../entities/appointment.typeorm-entity";

export class AppointmentMapper {
  static toDomain(e: AppointmentTypeOrmEntity): Appointment {
    return new Appointment(
      e.id,
      e.clinic_id,
      e.patient_id,
      e.patient_name,
      e.patient_phone,
      e.doctor_id,
      e.doctor_name,
      e.start_at,
      e.end_at,
      e.is_emergency,
      e.appointment_type,
      e.channel,
      e.status,
      e.notes,
      e.cancelled_at,
      e.cancellation_reason,
      e.created_by,
      e.created_at,
      e.updated_at,
    );
  }
}
