export interface WorkingHoursProperties {
  id: string;
  clinicId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export class WorkingHours {
  constructor(readonly properties: WorkingHoursProperties) {}
}
