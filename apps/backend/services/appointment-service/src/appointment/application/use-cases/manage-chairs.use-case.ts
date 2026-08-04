import { Inject, Injectable } from '@nestjs/common';

import { Chair } from '../../domain/entities/chair';
import {
  CreateChairInput,
  IChairRepository,
  UpdateChairInput,
} from '../../domain/repositories/chair-repository.interface';
import { IOutboxRepository } from '../../domain/repositories/outbox-repository.interface';
import { CHAIR_REPOSITORY, OUTBOX_REPOSITORY } from '../../appointment.tokens';

@Injectable()
export class ManageChairsUseCase {
  constructor(
    @Inject(CHAIR_REPOSITORY)
    private readonly chairs: IChairRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
  ) {}

  listByClinic(clinicId: string): Promise<Chair[]> {
    return this.chairs.listByClinic(clinicId);
  }

  listActiveByClinic(clinicId: string): Promise<Chair[]> {
    return this.chairs.listActiveByClinic(clinicId);
  }

  async create(input: CreateChairInput): Promise<Chair> {
    const chair = await this.chairs.create(input);
    await this.outbox.add({
      eventType: 'queue.chair.updated',
      payload: {
        clinic_id: chair.clinicId,
        chair: this.chairPayload(chair),
      },
    });
    return chair;
  }

  async update(
    clinicId: string,
    chairId: string,
    input: UpdateChairInput,
  ): Promise<Chair> {
    const chair = await this.chairs.update(clinicId, chairId, input);
    await this.outbox.add({
      eventType: 'queue.chair.updated',
      payload: {
        clinic_id: chair.clinicId,
        chair: this.chairPayload(chair),
      },
    });
    return chair;
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
