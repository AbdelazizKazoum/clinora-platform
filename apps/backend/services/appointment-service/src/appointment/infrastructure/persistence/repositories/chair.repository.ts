import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Chair } from '../../../domain/entities/chair';
import {
  CreateChairInput,
  IChairRepository,
  UpdateChairInput,
} from '../../../domain/repositories/chair-repository.interface';
import { ChairTypeOrmEntity } from '../entities/chair.typeorm-entity';
import { ChairMapper } from '../mappers/chair.mapper';

@Injectable()
export class ChairRepository implements IChairRepository {
  constructor(
    @InjectRepository(ChairTypeOrmEntity)
    private readonly repo: Repository<ChairTypeOrmEntity>,
  ) {}

  async create(input: CreateChairInput): Promise<Chair> {
    const name = this.normalizeName(input.name);
    const code = this.normalizeCode(input.code);
    const isActive = input.isActive ?? true;

    if (isActive) {
      await this.assertNoActiveDuplicate(input.clinicId, name, code);
    }

    const saved = await this.repo.save({
      clinic_id: input.clinicId,
      name,
      code,
      is_active: isActive,
    });

    return ChairMapper.toDomain(saved);
  }

  async findById(clinicId: string, id: string): Promise<Chair | null> {
    const entity = await this.repo.findOne({
      where: { clinic_id: clinicId, id },
    });
    return entity ? ChairMapper.toDomain(entity) : null;
  }

  async listByClinic(clinicId: string): Promise<Chair[]> {
    const entities = await this.repo.find({
      where: { clinic_id: clinicId },
      order: { is_active: 'DESC', name: 'ASC', code: 'ASC' },
    });

    return entities.map(ChairMapper.toDomain);
  }

  async listActiveByClinic(clinicId: string): Promise<Chair[]> {
    const entities = await this.repo.find({
      where: { clinic_id: clinicId, is_active: true },
      order: { name: 'ASC', code: 'ASC' },
    });

    return entities.map(ChairMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateChairInput,
  ): Promise<Chair> {
    const existing = await this.repo.findOne({
      where: { clinic_id: clinicId, id },
    });
    if (!existing) {
      throw new NotFoundException(`Chair "${id}" not found`);
    }

    const nextName =
      input.name !== undefined ? this.normalizeName(input.name) : existing.name;
    const nextCode =
      input.code !== undefined ? this.normalizeCode(input.code) : existing.code;
    const nextIsActive = input.isActive ?? existing.is_active;

    if (nextIsActive) {
      await this.assertNoActiveDuplicate(clinicId, nextName, nextCode, id);
    }

    const saved = await this.repo.save({
      ...existing,
      name: nextName,
      code: nextCode,
      is_active: nextIsActive,
    });

    return ChairMapper.toDomain(saved);
  }

  private normalizeName(name: string): string {
    const normalized = name.trim();
    if (!normalized) {
      throw new BadRequestException('Chair name is required');
    }
    return normalized;
  }

  private normalizeCode(code?: string): string {
    return code?.trim() ?? '';
  }

  private async assertNoActiveDuplicate(
    clinicId: string,
    name: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('chair')
      .where('chair.clinic_id = :clinicId', { clinicId })
      .andWhere('chair.is_active = :isActive', { isActive: true })
      .andWhere(
        new Brackets((duplicate) => {
          duplicate.where('chair.name = :name', { name });
          if (code) {
            duplicate.orWhere('chair.code = :code', { code });
          }
        }),
      );

    if (excludeId) {
      qb.andWhere('chair.id != :excludeId', { excludeId });
    }

    if ((await qb.getCount()) > 0) {
      throw new ConflictException(
        'An active chair with the same name or code already exists',
      );
    }
  }
}
