import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { WorkingHours } from '../../../domain/entities/working-hours';
import type {
  UpsertWorkingHoursEntry,
  WorkingHoursRepository,
} from '../../../domain/repositories/working-hours-repository.interface';
import { WorkingHoursTypeOrmEntity } from '../entities/working-hours.typeorm-entity';
import { WorkingHoursMapper } from '../mappers/working-hours.mapper';

@Injectable()
export class TypeOrmWorkingHoursRepository
  implements WorkingHoursRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async list(clinicId: string): Promise<WorkingHours[]> {
    const entities = await this.dataSource
      .getRepository(WorkingHoursTypeOrmEntity)
      .find({ where: { clinicId }, order: { dayOfWeek: 'ASC' } });
    return entities.map(WorkingHoursMapper.toDomain);
  }

  async upsert(
    clinicId: string,
    entries: UpsertWorkingHoursEntry[],
  ): Promise<WorkingHours[]> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(
        WorkingHoursTypeOrmEntity,
      );

      for (const input of entries) {
        const entity =
          (await repository.findOneBy({
            clinicId,
            dayOfWeek: input.dayOfWeek,
          })) ??
          repository.create({
            id: randomUUID(),
            clinicId,
            dayOfWeek: input.dayOfWeek,
          });
        entity.isClosed = input.isClosed;
        entity.openTime = input.isClosed
          ? null
          : this.normalizeTime(input.openTime);
        entity.closeTime = input.isClosed
          ? null
          : this.normalizeTime(input.closeTime);
        await repository.save(entity);
      }

      const saved = await repository.find({
        where: { clinicId },
        order: { dayOfWeek: 'ASC' },
      });
      return saved.map(WorkingHoursMapper.toDomain);
    });
  }

  private normalizeTime(value?: string): string {
    if (!value) {
      throw new Error('Working-hours time was not validated');
    }
    return value.length === 5 ? `${value}:00` : value;
  }
}
