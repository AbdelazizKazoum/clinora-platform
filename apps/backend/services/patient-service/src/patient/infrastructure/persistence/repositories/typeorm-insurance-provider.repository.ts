import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InsuranceProvider } from '../../../domain/entities/insurance-provider';
import type {
  CreateInsuranceProvider,
  InsuranceProviderRepository,
  UpdateInsuranceProvider,
} from '../../../domain/repositories/insurance-provider-repository.interface';
import { InsuranceProviderTypeOrmEntity } from '../entities/insurance-provider.typeorm-entity';
import { InsuranceProviderMapper } from '../mappers/insurance-provider.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmInsuranceProviderRepository
  implements InsuranceProviderRepository
{
  constructor(
    @InjectRepository(InsuranceProviderTypeOrmEntity)
    private readonly repository: Repository<InsuranceProviderTypeOrmEntity>,
  ) {}

  async create(input: CreateInsuranceProvider): Promise<InsuranceProvider> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      name: input.name.trim(),
      code: input.code?.trim() ?? null,
      isActive: input.isActive ?? true,
    });
    try {
      return InsuranceProviderMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(
    clinicId: string,
    id: string,
  ): Promise<InsuranceProvider | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? InsuranceProviderMapper.toDomain(entity) : null;
  }

  async list(
    clinicId: string,
    isActive?: boolean,
    search?: string,
  ): Promise<InsuranceProvider[]> {
    const builder = this.repository
      .createQueryBuilder('provider')
      .where('provider.clinicId = :clinicId', { clinicId });
    if (isActive !== undefined) {
      builder.andWhere('provider.isActive = :isActive', { isActive });
    }
    if (search) {
      builder.andWhere(
        '(provider.name LIKE :search OR provider.code LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }
    const entities = await builder.orderBy('provider.name', 'ASC').getMany();
    return entities.map(InsuranceProviderMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceProvider,
  ): Promise<InsuranceProvider | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) return null;
    if (input.name !== undefined) entity.name = input.name.trim();
    if (input.code !== undefined) entity.code = input.code?.trim() ?? null;
    if (input.isActive !== undefined) entity.isActive = input.isActive;
    try {
      return InsuranceProviderMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async delete(clinicId: string, id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ clinicId, id });
      return (result.affected ?? 0) > 0;
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<InsuranceProvider | null> {
    return this.update(clinicId, id, { isActive });
  }
}
