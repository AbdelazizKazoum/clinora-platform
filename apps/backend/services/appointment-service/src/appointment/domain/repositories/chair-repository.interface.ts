import { Chair } from '../entities/chair';

export interface CreateChairInput {
  clinicId: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateChairInput {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface IChairRepository {
  create(input: CreateChairInput): Promise<Chair>;
  findById(clinicId: string, id: string): Promise<Chair | null>;
  listByClinic(clinicId: string): Promise<Chair[]>;
  listActiveByClinic(clinicId: string): Promise<Chair[]>;
  update(clinicId: string, id: string, input: UpdateChairInput): Promise<Chair>;
}
