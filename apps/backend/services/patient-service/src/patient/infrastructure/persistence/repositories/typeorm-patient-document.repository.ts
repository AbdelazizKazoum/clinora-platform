import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientDocument } from '../../../domain/entities/patient-document';
import { DocumentType } from '../../../domain/enums/document-type.enum';
import type {
  CreatePatientDocument,
  PatientDocumentRepository,
  UpdatePatientDocument,
} from '../../../domain/repositories/patient-document-repository.interface';
import { PatientDocumentTypeOrmEntity } from '../entities/patient-document.typeorm-entity';
import { PatientDocumentMapper } from '../mappers/patient-document.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmPatientDocumentRepository
  implements PatientDocumentRepository
{
  constructor(
    @InjectRepository(PatientDocumentTypeOrmEntity)
    private readonly repository: Repository<PatientDocumentTypeOrmEntity>,
  ) {}

  async create(input: CreatePatientDocument): Promise<PatientDocument> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      patientId: input.patientId,
      type: input.type,
      title: input.title?.trim() ?? null,
      fileUrl: input.fileUrl.trim(),
    });
    try {
      return PatientDocumentMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(
    clinicId: string,
    id: string,
  ): Promise<PatientDocument | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? PatientDocumentMapper.toDomain(entity) : null;
  }

  async listByPatient(
    clinicId: string,
    patientId: string,
    type?: DocumentType,
  ): Promise<PatientDocument[]> {
    return this.list({ clinicId, patientId, type });
  }

  async listByClinic(
    clinicId: string,
    type?: DocumentType,
    patientId?: string,
    search?: string,
  ): Promise<PatientDocument[]> {
    const builder = this.repository
      .createQueryBuilder('document')
      .where('document.clinicId = :clinicId', { clinicId });
    if (type) builder.andWhere('document.type = :type', { type });
    if (patientId) {
      builder.andWhere('document.patientId = :patientId', { patientId });
    }
    if (search) {
      builder.andWhere('document.title LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }
    const entities = await builder
      .orderBy('document.createdAt', 'DESC')
      .getMany();
    return entities.map(PatientDocumentMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatientDocument,
  ): Promise<PatientDocument | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) return null;
    if (input.type !== undefined) entity.type = input.type;
    if (input.title !== undefined) {
      entity.title = input.title?.trim() ?? null;
    }
    if (input.fileUrl !== undefined) entity.fileUrl = input.fileUrl.trim();
    return PatientDocumentMapper.toDomain(await this.repository.save(entity));
  }

  async delete(clinicId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ clinicId, id });
    return (result.affected ?? 0) > 0;
  }

  async deleteMany(clinicId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('clinic_id = :clinicId', { clinicId })
      .andWhere('id IN (:...ids)', { ids })
      .execute();
  }

  private async list(
    filters: Partial<
      Pick<PatientDocumentTypeOrmEntity, 'clinicId' | 'patientId' | 'type'>
    >,
  ): Promise<PatientDocument[]> {
    const entities = await this.repository.find({
      where: filters,
      order: { createdAt: 'DESC' },
    });
    return entities.map(PatientDocumentMapper.toDomain);
  }
}
