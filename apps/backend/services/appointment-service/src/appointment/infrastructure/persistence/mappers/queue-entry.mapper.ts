import { QueueEntry } from '../../../domain/entities/queue-entry';
import { QueueEntryTypeOrmEntity } from '../entities/queue-entry.typeorm-entity';

export class QueueEntryMapper {
  static toDomain(e: QueueEntryTypeOrmEntity): QueueEntry {
    return new QueueEntry(
      e.id,
      e.clinic_id,
      e.appointment_id,
      e.patient_id,
      e.patient_name,
      e.patient_phone,
      e.doctor_id,
      e.doctor_name,
      e.appointment_type,
      e.status,
      e.priority,
      e.queue_notes,
      e.chair_id,
      e.chair_name,
      e.manual_order,
      e.arrived_at,
      e.called_at,
      e.seated_at,
      e.completed_at,
      e.updated_at,
    );
  }
}
