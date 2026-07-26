import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientInsurance } from '../../../domain/entities/patient-insurance';
import type {
  CreatePatientInsurance,
  PatientInsuranceRepository,
  UpdatePatientInsurance,
} from '../../../domain/repositories/patient-insurance-repository.interface';
import { PatientInsuranceTypeOrmEntity } from '../entities/patient-insurance.typeorm-entity';
import { PatientInsuranceMapper } from '../mappers/patient-insurance.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmPatientInsuranceRepository
  implements PatientInsuranceRepository
{
  constructor(
    @InjectRepository(PatientInsuranceTypeOrmEntity)
    private readonly repository: Repository<PatientInsuranceTypeOrmEntity>,
  ) {}

  async create(input: CreatePatientInsurance): Promise<PatientInsurance> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      patientId: input.patientId,
      insuranceProviderId: input.insuranceProviderId,
      policyNumber: input.policyNumber?.trim() ?? null,
      memberId: input.memberId?.trim() ?? null,
      isActive: input.isActive ?? true,
    });
    try {
      return PatientInsuranceMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(
    clinicId: string,
    id: string,
  ): Promise<PatientInsurance | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? PatientInsuranceMapper.toDomain(entity) : null;
  }

  async listByPatient(
    clinicId: string,
    patientId: string,
    isActive?: boolean,
  ): Promise<PatientInsurance[]> {
    return this.list({ clinicId, patientId, isActive });
  }

  async listByClinic(
    clinicId: string,
    isActive?: boolean,
    insuranceProviderId?: string,
  ): Promise<PatientInsurance[]> {
    return this.list({ clinicId, isActive, insuranceProviderId });
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatientInsurance,
  ): Promise<PatientInsurance | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) return null;
    if (input.policyNumber !== undefined) {
      entity.policyNumber = input.policyNumber?.trim() ?? null;
    }
    if (input.memberId !== undefined) {
      entity.memberId = input.memberId?.trim() ?? null;
    }
    if (input.isActive !== undefined) entity.isActive = input.isActive;
    return PatientInsuranceMapper.toDomain(
      await this.repository.save(entity),
    );
  }

  async delete(clinicId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ clinicId, id });
    return (result.affected ?? 0) > 0;
  }

  setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<PatientInsurance | null> {
    return this.update(clinicId, id, { isActive });
  }

  async setAllActive(
    clinicId: string,
    patientId: string,
    isActive: boolean,
  ): Promise<void> {
    await this.repository.update({ clinicId, patientId }, { isActive });
  }

  private async list(
    filters: Partial<
      Pick<
        PatientInsuranceTypeOrmEntity,
        'clinicId' | 'patientId' | 'insuranceProviderId' | 'isActive'
      >
    >,
  ): Promise<PatientInsurance[]> {
    const entities = await this.repository.find({
      where: filters,
      order: { createdAt: 'DESC' },
    });
    return entities.map(PatientInsuranceMapper.toDomain);
  }
}
