import { ClinicLocale } from '../enums/clinic-locale.enum';

export interface ClinicProperties {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  locale: ClinicLocale;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Clinic {
  constructor(readonly properties: ClinicProperties) {}

  get id(): string {
    return this.properties.id;
  }
}
