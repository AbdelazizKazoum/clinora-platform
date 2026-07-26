import { Inject, Injectable } from '@nestjs/common';

import { CLINIC_REPOSITORY } from '../../clinic.tokens';
import { Clinic } from '../../domain/entities/clinic';
import type {
  ClinicRepository,
  CreateClinic,
} from '../../domain/repositories/clinic-repository.interface';
import {
  ClinicRecordConflictError,
  ClinicRecordNotFoundError,
} from '../errors/clinic.errors';

@Injectable()
export class ManageClinicsUseCase {
  constructor(
    @Inject(CLINIC_REPOSITORY)
    private readonly clinics: ClinicRepository,
  ) {}

  async create(input: CreateClinic): Promise<Clinic> {
    const existing = await this.clinics.findBySlug(input.slug.trim());
    if (existing) {
      throw new ClinicRecordConflictError(
        `Clinic slug "${input.slug}" is already in use`,
      );
    }
    return this.clinics.create(input);
  }

  async get(id: string): Promise<Clinic> {
    const clinic = await this.clinics.findById(id);
    if (!clinic) {
      throw new ClinicRecordNotFoundError('Clinic', id);
    }
    return clinic;
  }
}
