import { QueuePriority } from '../../../domain/enums/queue-priority.enum';
import { QueueStatus } from '../../../domain/enums/queue-status.enum';
import { QueueEntryTypeOrmEntity } from '../entities/queue-entry.typeorm-entity';
import { QueueEntryMapper } from './queue-entry.mapper';

describe(QueueEntryMapper.name, () => {
  it('maps chair and manual ordering fields into the queue domain model', () => {
    const entity = new QueueEntryTypeOrmEntity();
    entity.id = 'queue-1';
    entity.clinic_id = 'clinic-1';
    entity.appointment_id = 'appointment-1';
    entity.patient_id = 'patient-1';
    entity.patient_name = 'Patient One';
    entity.patient_phone = null;
    entity.doctor_id = 'doctor-1';
    entity.doctor_name = 'Doctor One';
    entity.appointment_type = 'Checkup';
    entity.status = QueueStatus.IN_CHAIR;
    entity.priority = QueuePriority.URGENT;
    entity.queue_notes = null;
    entity.chair_id = 'chair-1';
    entity.chair_name = 'Operatory 1';
    entity.manual_order = 20;
    entity.arrived_at = new Date('2026-08-04T08:00:00.000Z');
    entity.called_at = new Date('2026-08-04T08:05:00.000Z');
    entity.seated_at = new Date('2026-08-04T08:10:00.000Z');
    entity.completed_at = null;
    entity.updated_at = new Date('2026-08-04T08:10:00.000Z');

    const entry = QueueEntryMapper.toDomain(entity);

    expect(entry.chairId).toBe('chair-1');
    expect(entry.chairName).toBe('Operatory 1');
    expect(entry.manualOrder).toBe(20);
  });
});
