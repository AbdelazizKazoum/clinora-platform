import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Clinic } from '../../../domain/entities/clinic';
import { ClinicLocale } from '../../../domain/enums/clinic-locale.enum';
import type {
  ClinicRepository,
  CreateClinic,
} from '../../../domain/repositories/clinic-repository.interface';
import { ClinicTypeOrmEntity } from '../entities/clinic.typeorm-entity';
import { ClinicMapper } from '../mappers/clinic.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmClinicRepository implements ClinicRepository {
  constructor(
    @InjectRepository(ClinicTypeOrmEntity)
    private readonly repository: Repository<ClinicTypeOrmEntity>,
  ) {}

  async create(input: CreateClinic): Promise<Clinic> {
    const entity = this.repository.create({
      id: randomUUID(),
      slug: input.slug.trim().toLowerCase(),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      address: input.address?.trim() || null,
      timezone: input.timezone?.trim() || 'Africa/Casablanca',
      locale: input.locale ?? ClinicLocale.French,
      isActive: true,
    });
    try {
      return ClinicMapper.toDomain(await this.repository.save(entity));
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(id: string): Promise<Clinic | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? ClinicMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Clinic | null> {
    const entity = await this.repository.findOneBy({
      slug: slug.toLowerCase(),
    });
    return entity ? ClinicMapper.toDomain(entity) : null;
  }
}
