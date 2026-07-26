import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InsuranceTemplate } from '../../../domain/entities/insurance-template';
import type {
  CreateInsuranceTemplate,
  InsuranceTemplateRepository,
  UpdateInsuranceTemplate,
} from '../../../domain/repositories/insurance-template-repository.interface';
import { InsuranceTemplateTypeOrmEntity } from '../entities/insurance-template.typeorm-entity';
import { InsuranceTemplateMapper } from '../mappers/insurance-template.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmInsuranceTemplateRepository
  implements InsuranceTemplateRepository
{
  constructor(
    @InjectRepository(InsuranceTemplateTypeOrmEntity)
    private readonly repository: Repository<InsuranceTemplateTypeOrmEntity>,
  ) {}

  async create(input: CreateInsuranceTemplate): Promise<InsuranceTemplate> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      insuranceProviderId: input.insuranceProviderId,
      name: input.name.trim(),
      fileUrl: input.fileUrl.trim(),
    });
    try {
      return InsuranceTemplateMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(
    clinicId: string,
    id: string,
  ): Promise<InsuranceTemplate | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? InsuranceTemplateMapper.toDomain(entity) : null;
  }

  async list(
    clinicId: string,
    providerId?: string,
    providerIds?: string[],
    search?: string,
  ): Promise<InsuranceTemplate[]> {
    const builder = this.repository
      .createQueryBuilder('template')
      .where('template.clinicId = :clinicId', { clinicId });
    if (providerId) {
      builder.andWhere('template.insuranceProviderId = :providerId', {
        providerId,
      });
    } else if (providerIds?.length) {
      builder.andWhere('template.insuranceProviderId IN (:...providerIds)', {
        providerIds,
      });
    }
    if (search) {
      builder.andWhere('template.name LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }
    const entities = await builder.orderBy('template.name', 'ASC').getMany();
    return entities.map(InsuranceTemplateMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceTemplate,
  ): Promise<InsuranceTemplate | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) return null;
    if (input.name !== undefined) entity.name = input.name.trim();
    if (input.fileUrl !== undefined) entity.fileUrl = input.fileUrl.trim();
    try {
      return InsuranceTemplateMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async delete(clinicId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ clinicId, id });
    return (result.affected ?? 0) > 0;
  }
}
