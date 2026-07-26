import { Inject, Injectable } from '@nestjs/common';

import {
  CLINIC_REPOSITORY,
  WORKING_HOURS_REPOSITORY,
} from '../../clinic.tokens';
import { WorkingHours } from '../../domain/entities/working-hours';
import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type {
  UpsertWorkingHoursEntry,
  WorkingHoursRepository,
} from '../../domain/repositories/working-hours-repository.interface';
import {
  ClinicRecordNotFoundError,
  ClinicValidationError,
} from '../errors/clinic.errors';

@Injectable()
export class ManageWorkingHoursUseCase {
  constructor(
    @Inject(CLINIC_REPOSITORY)
    private readonly clinics: ClinicRepository,
    @Inject(WORKING_HOURS_REPOSITORY)
    private readonly workingHours: WorkingHoursRepository,
  ) {}

  async get(clinicId: string): Promise<WorkingHours[]> {
    await this.assertClinicExists(clinicId);
    return this.workingHours.list(clinicId);
  }

  async upsert(
    clinicId: string,
    entries: UpsertWorkingHoursEntry[],
  ): Promise<WorkingHours[]> {
    await this.assertClinicExists(clinicId);
    this.validate(entries);
    return this.workingHours.upsert(clinicId, entries);
  }

  private async assertClinicExists(clinicId: string): Promise<void> {
    if (!(await this.clinics.findById(clinicId))) {
      throw new ClinicRecordNotFoundError('Clinic', clinicId);
    }
  }

  private validate(entries: UpsertWorkingHoursEntry[]): void {
    if (entries.length === 0) {
      throw new ClinicValidationError(
        'At least one working-hours entry is required',
      );
    }

    const uniqueDays = new Set(entries.map((entry) => entry.dayOfWeek));
    if (uniqueDays.size !== entries.length) {
      throw new ClinicValidationError(
        'Working-hours entries cannot contain duplicate days',
      );
    }

    for (const entry of entries) {
      if (entry.isClosed) {
        continue;
      }
      if (!entry.openTime || !entry.closeTime) {
        throw new ClinicValidationError(
          `Open and close times are required for day ${entry.dayOfWeek}`,
        );
      }
      const openTime = this.normalizeTime(entry.openTime);
      const closeTime = this.normalizeTime(entry.closeTime);
      if (openTime >= closeTime) {
        throw new ClinicValidationError(
          `Open time must be before close time for day ${entry.dayOfWeek}`,
        );
      }
    }
  }

  private normalizeTime(value: string): string {
    const match =
      /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.exec(value);
    if (!match) {
      throw new ClinicValidationError(
        `Time "${value}" must use HH:mm or HH:mm:ss`,
      );
    }
    return value.length === 5 ? `${value}:00` : value;
  }
}
