import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {QueueEntry} from "../../../domain/entities/queue-entry";
import {QueuePriority} from "../../../domain/enums/queue-priority.enum";
import {QueueStatus} from "../../../domain/enums/queue-status.enum";
import {
  CheckInPatientInput,
  IQueueRepository,
} from "../../../domain/repositories/queue-repository.interface";
import {QueueEntryTypeOrmEntity} from "../entities/queue-entry.typeorm-entity";
import {QueueEntryMapper} from "../mappers/queue-entry.mapper";

const QUEUE_ORDER: QueueStatus[] = [
  QueueStatus.ARRIVED,
  QueueStatus.WAITING,
  QueueStatus.IN_CHAIR,
  QueueStatus.DONE,
];

@Injectable()
export class QueueRepository implements IQueueRepository {
  constructor(
    @InjectRepository(QueueEntryTypeOrmEntity)
    private readonly repo: Repository<QueueEntryTypeOrmEntity>,
  ) {}

  async create(input: CheckInPatientInput): Promise<QueueEntry> {
    const existing = await this.findByAppointmentId(input.appointmentId);
    if (existing) {
      throw new ConflictException("Appointment is already checked in");
    }

    const saved = await this.repo.save({
      clinic_id: input.clinicId,
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      patient_name: input.patientName,
      patient_phone: input.patientPhone ?? null,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      appointment_type: input.appointmentType ?? null,
      status: QueueStatus.ARRIVED,
      priority: input.priority ?? QueuePriority.NORMAL,
      queue_notes: input.notes ?? null,
      arrived_at: input.arrivedAt ?? new Date(),
      called_at: null,
      seated_at: null,
      completed_at: null,
    });

    return QueueEntryMapper.toDomain(saved);
  }

  async findById(id: string): Promise<QueueEntry | null> {
    const entity = await this.repo.findOne({where: {id}});
    return entity ? QueueEntryMapper.toDomain(entity) : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<QueueEntry | null> {
    const entity = await this.repo.findOne({
      where: {appointment_id: appointmentId},
    });
    return entity ? QueueEntryMapper.toDomain(entity) : null;
  }

  async listByClinic(clinicId: string): Promise<QueueEntry[]> {
    const entities = await this.repo
      .createQueryBuilder("q")
      .where("q.clinic_id = :clinicId", {clinicId})
      .orderBy(
        "FIELD(q.status, 'ARRIVED', 'WAITING', 'IN_CHAIR', 'DONE')",
        "ASC",
      )
      .addOrderBy("FIELD(q.priority, 'EMERGENCY', 'URGENT', 'NORMAL')", "ASC")
      .addOrderBy("q.arrived_at", "ASC")
      .getMany();

    return entities.map(QueueEntryMapper.toDomain);
  }

  async updateStatus(
    id: string,
    status: QueueStatus,
    correctionReason?: string,
  ): Promise<QueueEntry> {
    const existing = await this.repo.findOne({where: {id}});
    if (!existing)
      throw new NotFoundException(`Queue entry \"${id}\" not found`);

    const currentIndex = QUEUE_ORDER.indexOf(existing.status);
    const nextIndex = QUEUE_ORDER.indexOf(status);
    if (nextIndex === -1) {
      throw new BadRequestException(`Invalid queue status \"${status}\"`);
    }
    if (nextIndex < currentIndex && !correctionReason?.trim()) {
      throw new BadRequestException(
        "Correction reason is required when reverting queue status",
      );
    }

    const now = new Date();
    const saved = await this.repo.save({
      ...existing,
      status,
      queue_notes: correctionReason
        ? this.appendCorrection(existing.queue_notes, correctionReason)
        : existing.queue_notes,
      called_at:
        status === QueueStatus.WAITING && !existing.called_at
          ? now
          : existing.called_at,
      seated_at:
        status === QueueStatus.IN_CHAIR && !existing.seated_at
          ? now
          : existing.seated_at,
      completed_at:
        status === QueueStatus.DONE && !existing.completed_at
          ? now
          : existing.completed_at,
    });

    return QueueEntryMapper.toDomain(saved);
  }

  async updateNotes(id: string, notes?: string | null): Promise<QueueEntry> {
    const existing = await this.repo.findOne({where: {id}});
    if (!existing)
      throw new NotFoundException(`Queue entry \"${id}\" not found`);

    const saved = await this.repo.save({
      ...existing,
      queue_notes: notes ?? null,
    });
    return QueueEntryMapper.toDomain(saved);
  }

  private appendCorrection(existing: string | null, reason: string): string {
    const suffix = `[Correction] ${reason.trim()}`;
    return existing ? `${existing}\n${suffix}` : suffix;
  }
}
