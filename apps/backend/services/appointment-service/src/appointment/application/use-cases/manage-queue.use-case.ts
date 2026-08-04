import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueueStatus } from '../../domain/enums/queue-status.enum';
import {
  CheckInPatientInput,
  IQueueRepository,
} from '../../domain/repositories/queue-repository.interface';
import { IOutboxRepository } from '../../domain/repositories/outbox-repository.interface';
import {
  APPOINTMENT_REPOSITORY,
  OUTBOX_REPOSITORY,
  QUEUE_REPOSITORY,
} from '../../appointment.tokens';
import { IAppointmentRepository } from '../../domain/repositories/appointment-repository.interface';

@Injectable()
export class ManageQueueUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY)
    private readonly queue: IQueueRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
  ) {}

  listByClinic(clinicId: string): Promise<QueueEntry[]> {
    return this.queue.listByClinic(clinicId);
  }

  async getById(id: string): Promise<QueueEntry> {
    const entry = await this.queue.findById(id);
    if (!entry) throw new NotFoundException(`Queue entry "${id}" not found`);
    return entry;
  }

  async checkIn(input: CheckInPatientInput): Promise<QueueEntry> {
    const appointment = await this.appointments.findById(input.appointmentId);
    if (!appointment) {
      throw new NotFoundException(
        `Appointment "${input.appointmentId}" not found`,
      );
    }
    if (appointment.clinicId !== input.clinicId) {
      throw new BadRequestException(
        'Appointment does not belong to this clinic',
      );
    }

    const created = await this.queue.create(input);
    await this.outbox.add({
      eventType: 'queue.checked_in',
      payload: this.queuePayload(created),
    });
    return created;
  }

  async updateStatus(
    id: string,
    status: QueueStatus,
    correctionReason?: string,
  ): Promise<QueueEntry> {
    const updated = await this.queue.updateStatus(id, status, correctionReason);
    await this.outbox.add({
      eventType: 'queue.status.updated',
      payload: this.queuePayload(updated),
    });
    return updated;
  }

  async updateNotes(id: string, notes?: string | null): Promise<QueueEntry> {
    const updated = await this.queue.updateNotes(id, notes);
    await this.outbox.add({
      eventType: 'queue.notes.updated',
      payload: this.queuePayload(updated),
    });
    return updated;
  }

  private queuePayload(entry: QueueEntry): Record<string, unknown> {
    return {
      id: entry.id,
      clinic_id: entry.clinicId,
      appointment_id: entry.appointmentId,
      patient_id: entry.patientId,
      patient_name: entry.patientName,
      patient_phone: entry.patientPhone ?? undefined,
      doctor_id: entry.doctorId,
      doctor_name: entry.doctorName,
      appointment_type: entry.appointmentType ?? undefined,
      status: entry.status,
      priority: entry.priority,
      queue_notes: entry.notes ?? undefined,
      chair_id: entry.chairId ?? undefined,
      chair_name: entry.chairName ?? undefined,
      manual_order: entry.manualOrder ?? undefined,
      arrived_at: entry.arrivedAt.toISOString(),
      called_at: entry.calledAt?.toISOString(),
      seated_at: entry.seatedAt?.toISOString(),
      completed_at: entry.completedAt?.toISOString(),
    };
  }
}
