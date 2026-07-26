import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Patient } from '../../../domain/entities/patient';
import { PatientStatus } from '../../../domain/enums/patient-status.enum';
import type {
  CreatePatient,
  ListPatients,
  PatientListResult,
  PatientRepository,
  UpdatePatient,
} from '../../../domain/repositories/patient-repository.interface';
import { PatientTypeOrmEntity } from '../entities/patient.typeorm-entity';
import { PatientMapper } from '../mappers/patient.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmPatientRepository implements PatientRepository {
  constructor(
    @InjectRepository(PatientTypeOrmEntity)
    private readonly repository: Repository<PatientTypeOrmEntity>,
  ) {}

  async create(input: CreatePatient): Promise<Patient> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      userId: input.userId ?? null,
      phone: input.phone ?? null,
      email: input.email?.trim().toLowerCase() ?? null,
      dateOfBirth: input.dateOfBirth
        ? this.toDatabaseDate(input.dateOfBirth)
        : null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      allergies: input.allergies ?? null,
      chronicConditions: input.chronicConditions ?? null,
      currentMedications: input.currentMedications ?? null,
      medicalNotes: input.medicalNotes ?? null,
      status: input.status ?? PatientStatus.Active,
      deletedAt: null,
    });
    try {
      return PatientMapper.toDomain(await this.repository.save(entity));
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(clinicId: string, id: string): Promise<Patient | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? PatientMapper.toDomain(entity) : null;
  }

  async findByUserId(
    clinicId: string,
    userId: string,
  ): Promise<Patient | null> {
    const entity = await this.repository.findOneBy({ clinicId, userId });
    return entity ? PatientMapper.toDomain(entity) : null;
  }

  async list(query: ListPatients): Promise<PatientListResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const builder = this.repository
      .createQueryBuilder('patient')
      .where('patient.clinicId = :clinicId', {
        clinicId: query.clinicId,
      });

    if (query.status) {
      builder.andWhere('patient.status = :status', { status: query.status });
    }
    if (query.gender) {
      builder.andWhere('patient.gender = :gender', { gender: query.gender });
    }
    if (query.search) {
      builder.andWhere(
        new Brackets((search) => {
          search
            .where('patient.firstName LIKE :search')
            .orWhere('patient.lastName LIKE :search')
            .orWhere('patient.phone LIKE :search')
            .orWhere('patient.email LIKE :search');
        }),
        { search: `%${query.search.trim()}%` },
      );
    }
    if (query.isNew) {
      const threshold = new Date();
      threshold.setUTCDate(threshold.getUTCDate() - 30);
      builder.andWhere('patient.createdAt >= :threshold', { threshold });
    }
    if (query.createdFrom) {
      builder.andWhere('patient.createdAt >= :createdFrom', {
        createdFrom: query.createdFrom,
      });
    }
    if (query.createdTo) {
      builder.andWhere('patient.createdAt <= :createdTo', {
        createdTo: query.createdTo,
      });
    }

    const sortColumns = {
      firstName: 'patient.firstName',
      lastName: 'patient.lastName',
      createdAt: 'patient.createdAt',
      updatedAt: 'patient.updatedAt',
    } as const;
    builder
      .orderBy(
        sortColumns[query.sortBy ?? 'createdAt'],
        query.sortOrder === 'asc' ? 'ASC' : 'DESC',
      )
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, total] = await builder.getManyAndCount();
    return {
      items: entities.map(PatientMapper.toDomain),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchByName(
    clinicId: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Patient[]> {
    const builder = this.repository
      .createQueryBuilder('patient')
      .where('patient.clinicId = :clinicId', { clinicId });
    if (firstName) {
      builder.andWhere('patient.firstName LIKE :firstName', {
        firstName: `%${firstName.trim()}%`,
      });
    }
    if (lastName) {
      builder.andWhere('patient.lastName LIKE :lastName', {
        lastName: `%${lastName.trim()}%`,
      });
    }
    const entities = await builder
      .orderBy('patient.lastName', 'ASC')
      .addOrderBy('patient.firstName', 'ASC')
      .getMany();
    return entities.map(PatientMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatient,
  ): Promise<Patient | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) {
      return null;
    }
    this.applyUpdates(entity, input);
    try {
      return PatientMapper.toDomain(await this.repository.save(entity));
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

  async softDelete(clinicId: string, id: string): Promise<boolean> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) {
      return false;
    }
    entity.status = PatientStatus.Archived;
    await this.repository.save(entity);
    const result = await this.repository.softDelete({ clinicId, id });
    return (result.affected ?? 0) > 0;
  }

  async restore(clinicId: string, id: string): Promise<Patient | null> {
    const entity = await this.repository.findOne({
      where: { clinicId, id },
      withDeleted: true,
    });
    if (!entity) {
      return null;
    }
    await this.repository.restore({ clinicId, id });
    entity.deletedAt = null;
    entity.status = PatientStatus.Active;
    return PatientMapper.toDomain(await this.repository.save(entity));
  }

  private applyUpdates(
    entity: PatientTypeOrmEntity,
    input: UpdatePatient,
  ): void {
    if (input.firstName !== undefined) {
      entity.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      entity.lastName = input.lastName.trim();
    }
    if (input.phone !== undefined) entity.phone = input.phone;
    if (input.email !== undefined) {
      entity.email = input.email?.trim().toLowerCase() ?? null;
    }
    if (input.dateOfBirth !== undefined) {
      entity.dateOfBirth = input.dateOfBirth
        ? this.toDatabaseDate(input.dateOfBirth)
        : null;
    }
    if (input.gender !== undefined) entity.gender = input.gender;
    if (input.address !== undefined) entity.address = input.address;
    if (input.notes !== undefined) entity.notes = input.notes;
    if (input.allergies !== undefined) entity.allergies = input.allergies;
    if (input.chronicConditions !== undefined) {
      entity.chronicConditions = input.chronicConditions;
    }
    if (input.currentMedications !== undefined) {
      entity.currentMedications = input.currentMedications;
    }
    if (input.medicalNotes !== undefined) {
      entity.medicalNotes = input.medicalNotes;
    }
    if (input.status !== undefined) entity.status = input.status;
  }

  private toDatabaseDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
