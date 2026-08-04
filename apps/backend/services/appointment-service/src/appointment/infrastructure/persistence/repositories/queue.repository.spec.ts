import type { Repository } from 'typeorm';

import { QueuePriority } from '../../../domain/enums/queue-priority.enum';
import { QueueStatus } from '../../../domain/enums/queue-status.enum';
import { QueueEntryTypeOrmEntity } from '../entities/queue-entry.typeorm-entity';
import { QueueRepository } from './queue.repository';

function createQueueEntity(
  overrides: Partial<QueueEntryTypeOrmEntity> = {},
): QueueEntryTypeOrmEntity {
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
  entity.status = QueueStatus.ARRIVED;
  entity.priority = QueuePriority.NORMAL;
  entity.queue_notes = null;
  entity.chair_id = null;
  entity.chair_name = null;
  entity.manual_order = null;
  entity.arrived_at = new Date('2026-08-04T08:00:00.000Z');
  entity.called_at = null;
  entity.seated_at = null;
  entity.completed_at = null;
  entity.updated_at = new Date('2026-08-04T08:00:00.000Z');

  return Object.assign(entity, overrides);
}

describe(QueueRepository.name, () => {
  const queryBuilder = {
    where: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getMany: jest.fn(),
  };
  const ormRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let queue: QueueRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    queryBuilder.where.mockReturnThis();
    queryBuilder.orderBy.mockReturnThis();
    queryBuilder.addOrderBy.mockReturnThis();
    queryBuilder.getMany.mockResolvedValue([]);
    ormRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    ormRepository.findOne.mockResolvedValue(null);
    ormRepository.save.mockImplementation(
      async (entity: Partial<QueueEntryTypeOrmEntity>) =>
        createQueueEntity({
          clinic_id: entity.clinic_id ?? 'clinic-1',
          appointment_id: entity.appointment_id ?? 'appointment-1',
          patient_id: entity.patient_id ?? 'patient-1',
          patient_name: entity.patient_name ?? 'Patient One',
          patient_phone: entity.patient_phone ?? null,
          doctor_id: entity.doctor_id ?? 'doctor-1',
          doctor_name: entity.doctor_name ?? 'Doctor One',
          appointment_type: entity.appointment_type ?? null,
          status: entity.status ?? QueueStatus.ARRIVED,
          priority: entity.priority ?? QueuePriority.NORMAL,
          queue_notes: entity.queue_notes ?? null,
          chair_id: entity.chair_id ?? null,
          chair_name: entity.chair_name ?? null,
          manual_order: entity.manual_order ?? null,
          arrived_at: entity.arrived_at ?? new Date('2026-08-04T08:00:00.000Z'),
          called_at: entity.called_at ?? null,
          seated_at: entity.seated_at ?? null,
          completed_at: entity.completed_at ?? null,
        }),
    );
    queue = new QueueRepository(
      ormRepository as unknown as Repository<QueueEntryTypeOrmEntity>,
    );
  });

  it('creates checked-in queue entries without chair or manual order assignment', async () => {
    const entry = await queue.create({
      clinicId: 'clinic-1',
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Patient One',
      doctorId: 'doctor-1',
      doctorName: 'Doctor One',
    });

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        chair_id: null,
        chair_name: null,
        manual_order: null,
      }),
    );
    expect(entry.chairId).toBeNull();
    expect(entry.chairName).toBeNull();
    expect(entry.manualOrder).toBeNull();
  });

  it('keeps automatic queue ordering as fallback after persisted manual order', async () => {
    await queue.listByClinic('clinic-1');

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "FIELD(q.status, 'ARRIVED', 'WAITING', 'IN_CHAIR', 'DONE')",
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'CASE WHEN q.manual_order IS NULL THEN 1 ELSE 0 END',
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'q.manual_order',
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      "FIELD(q.priority, 'EMERGENCY', 'URGENT', 'NORMAL')",
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('q.arrived_at', 'ASC');
  });
});
