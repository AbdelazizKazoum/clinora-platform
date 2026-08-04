import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Chair } from '../../domain/entities/chair';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueueStatus } from '../../domain/enums/queue-status.enum';
import { IChairRepository } from '../../domain/repositories/chair-repository.interface';
import { IOutboxRepository } from '../../domain/repositories/outbox-repository.interface';
import { IQueueRepository } from '../../domain/repositories/queue-repository.interface';
import {
  CHAIR_REPOSITORY,
  OUTBOX_REPOSITORY,
  QUEUE_REPOSITORY,
} from '../../appointment.tokens';
import {
  WaitingRoomChairState,
  WaitingRoomState,
} from '../models/waiting-room-state';

const QUEUE_ORDER: QueueStatus[] = [
  QueueStatus.ARRIVED,
  QueueStatus.WAITING,
  QueueStatus.IN_CHAIR,
  QueueStatus.DONE,
];

export interface UpdateWaitingRoomStatusInput {
  queueEntryId: string;
  status: QueueStatus;
  chairId?: string;
  correctionReason?: string;
  targetOrderedEntryIds?: string[];
}

export interface ReorderWaitingRoomEntriesInput {
  clinicId: string;
  mode: 'AUTO' | 'MANUAL';
  status?: QueueStatus;
  orderedEntryIds?: string[];
}

@Injectable()
export class ManageWaitingRoomUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY)
    private readonly queue: IQueueRepository,
    @Inject(CHAIR_REPOSITORY)
    private readonly chairs: IChairRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
  ) {}

  async getState(clinicId: string): Promise<WaitingRoomState> {
    const [entries, chairs] = await Promise.all([
      this.queue.listByClinic(clinicId),
      this.chairs.listByClinic(clinicId),
    ]);

    return {
      entries,
      chairs: this.toChairStates(chairs, entries),
      ordering: {
        mode: entries.some((entry) => entry.manualOrder !== null)
          ? 'MANUAL'
          : 'AUTO',
        manualStatuses: QUEUE_ORDER.filter((status) =>
          entries.some(
            (entry) => entry.status === status && entry.manualOrder !== null,
          ),
        ),
      },
      generatedAt: new Date(),
    };
  }

  async updateStatus(
    clinicId: string,
    input: UpdateWaitingRoomStatusInput,
  ): Promise<QueueEntry> {
    const entry = await this.getEntryForClinic(clinicId, input.queueEntryId);
    this.assertCorrectionReason(
      entry.status,
      input.status,
      input.correctionReason,
    );

    const chair =
      input.status === QueueStatus.IN_CHAIR
        ? await this.resolveAssignableChair(clinicId, entry, input.chairId)
        : null;

    const updated = await this.queue.updateWaitingRoomStatus({
      id: entry.id,
      status: input.status,
      correctionReason: input.correctionReason,
      ...(chair ? { chairId: chair.id, chairName: chair.name } : {}),
    });

    const reorderedEntries = input.targetOrderedEntryIds
      ? await this.reorderManual({
          clinicId,
          status: input.status,
          orderedEntryIds: input.targetOrderedEntryIds,
        })
      : null;

    await this.outbox.add({
      eventType: 'queue.status.updated',
      payload: this.queuePayload(updated),
    });
    if (reorderedEntries) {
      await this.outbox.add({
        eventType: 'queue.reordered',
        payload: {
          clinic_id: clinicId,
          status: input.status,
          entries: reorderedEntries.map((entry) => this.queuePayload(entry)),
        },
      });
    }

    return updated;
  }

  async assignChair(
    clinicId: string,
    queueEntryId: string,
    chairId: string,
  ): Promise<QueueEntry> {
    const entry = await this.getEntryForClinic(clinicId, queueEntryId);
    if (entry.status !== QueueStatus.IN_CHAIR) {
      throw new BadRequestException(
        'Chair assignment is only available for seated queue entries',
      );
    }

    const chair = await this.resolveAssignableChair(clinicId, entry, chairId);
    const updated = await this.queue.assignChair({
      id: entry.id,
      chairId: chair.id,
      chairName: chair.name,
    });

    await this.outbox.add({
      eventType: 'queue.chair.assigned',
      payload: {
        ...this.queuePayload(updated),
        chair: this.chairPayload(chair),
      },
    });

    return updated;
  }

  async updateNotes(
    clinicId: string,
    queueEntryId: string,
    notes?: string | null,
  ): Promise<QueueEntry> {
    const entry = await this.getEntryForClinic(clinicId, queueEntryId);
    const updated = await this.queue.updateNotes(entry.id, notes);

    await this.outbox.add({
      eventType: 'queue.notes.updated',
      payload: this.queuePayload(updated),
    });

    return updated;
  }

  async reorder(input: ReorderWaitingRoomEntriesInput): Promise<QueueEntry[]> {
    const entries =
      input.mode === 'AUTO'
        ? await this.clearManualOrder(input.clinicId, input.status)
        : await this.reorderManual({
            clinicId: input.clinicId,
            status: this.requireStatus(input.status),
            orderedEntryIds: this.requireOrderedIds(input.orderedEntryIds),
          });

    await this.outbox.add({
      eventType: 'queue.reordered',
      payload: {
        clinic_id: input.clinicId,
        status: input.status,
        entries: entries.map((entry) => this.queuePayload(entry)),
      },
    });

    return entries;
  }

  private async reorderManual(input: {
    clinicId: string;
    status: QueueStatus;
    orderedEntryIds: string[];
  }): Promise<QueueEntry[]> {
    const statusEntries = (
      await this.queue.listByClinic(input.clinicId)
    ).filter((entry) => entry.status === input.status);
    const statusEntryIds = new Set(statusEntries.map((entry) => entry.id));

    if (
      input.orderedEntryIds.length !== statusEntries.length ||
      input.orderedEntryIds.some((id) => !statusEntryIds.has(id))
    ) {
      throw new BadRequestException(
        'Reorder entries must match the requested clinic and status',
      );
    }

    return this.queue.reorderStatus(input);
  }

  private clearManualOrder(
    clinicId: string,
    status?: QueueStatus,
  ): Promise<QueueEntry[]> {
    return this.queue.clearManualOrder({ clinicId, status });
  }

  private async getEntryForClinic(
    clinicId: string,
    queueEntryId: string,
  ): Promise<QueueEntry> {
    const entry = await this.queue.findById(queueEntryId);
    if (!entry) {
      throw new NotFoundException(`Queue entry "${queueEntryId}" not found`);
    }
    if (entry.clinicId !== clinicId) {
      throw new BadRequestException(
        'Queue entry does not belong to this clinic',
      );
    }
    return entry;
  }

  private assertCorrectionReason(
    currentStatus: QueueStatus,
    nextStatus: QueueStatus,
    correctionReason?: string,
  ): void {
    const currentIndex = QUEUE_ORDER.indexOf(currentStatus);
    const nextIndex = QUEUE_ORDER.indexOf(nextStatus);
    if (nextIndex === -1) {
      throw new BadRequestException(`Invalid queue status "${nextStatus}"`);
    }
    if (nextIndex < currentIndex && !correctionReason?.trim()) {
      throw new BadRequestException(
        'Correction reason is required when reverting queue status',
      );
    }
  }

  private async resolveAssignableChair(
    clinicId: string,
    entry: QueueEntry,
    chairId?: string,
  ): Promise<Chair> {
    const targetChairId = chairId ?? entry.chairId;
    if (!targetChairId) {
      throw new BadRequestException(
        'An active chair is required before seating a patient',
      );
    }

    const chair = await this.chairs.findById(clinicId, targetChairId);
    if (!chair || !chair.isAssignable) {
      throw new BadRequestException('Selected chair is not active');
    }

    const occupied = await this.queue.findInChairByChairId(
      clinicId,
      targetChairId,
      entry.id,
    );
    if (occupied) {
      throw new ConflictException('Selected chair is already occupied');
    }

    return chair;
  }

  private requireStatus(status?: QueueStatus): QueueStatus {
    if (!status) {
      throw new BadRequestException('Status is required for manual reorder');
    }
    return status;
  }

  private requireOrderedIds(orderedEntryIds?: string[]): string[] {
    if (!orderedEntryIds?.length) {
      throw new BadRequestException(
        'orderedEntryIds is required for manual reorder',
      );
    }
    return orderedEntryIds;
  }

  private toChairStates(
    chairs: Chair[],
    entries: QueueEntry[],
  ): WaitingRoomChairState[] {
    return chairs.map((chair) => {
      const occupiedByEntryId =
        entries.find(
          (entry) =>
            entry.status === QueueStatus.IN_CHAIR && entry.chairId === chair.id,
        )?.id ?? null;

      return {
        chair,
        occupiedByEntryId,
        isAvailable: chair.isAssignable && !occupiedByEntryId,
      };
    });
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
      updated_at: entry.updatedAt.toISOString(),
    };
  }

  private chairPayload(chair: Chair): Record<string, unknown> {
    return {
      id: chair.id,
      clinic_id: chair.clinicId,
      name: chair.name,
      code: chair.code,
      is_active: chair.isActive,
      created_at: chair.properties.createdAt.toISOString(),
      updated_at: chair.properties.updatedAt.toISOString(),
    };
  }
}
