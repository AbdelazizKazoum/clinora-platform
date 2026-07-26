import { WorkingHours } from '../entities/working-hours';

export interface UpsertWorkingHoursEntry {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export interface WorkingHoursRepository {
  list(clinicId: string): Promise<WorkingHours[]>;
  upsert(
    clinicId: string,
    entries: UpsertWorkingHoursEntry[],
  ): Promise<WorkingHours[]>;
}
