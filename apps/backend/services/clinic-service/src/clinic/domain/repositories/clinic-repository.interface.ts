import { Clinic } from '../entities/clinic';
import { ClinicLocale } from '../enums/clinic-locale.enum';

export interface CreateClinic {
  slug: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
  locale?: ClinicLocale;
}

export interface ClinicRepository {
  create(input: CreateClinic): Promise<Clinic>;
  findById(id: string): Promise<Clinic | null>;
  findBySlug(slug: string): Promise<Clinic | null>;
}
