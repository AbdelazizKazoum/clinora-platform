import { User } from '../entities/user';

export interface UpdateUserAvailabilityInput {
  userId: string;
  clinicId: string;
  isActive: boolean;
}

export interface UserRepository {
  findByEmailAndClinic(email: string, clinicId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdAndClinic(userId: string, clinicId: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updateAvailability(input: UpdateUserAvailabilityInput): Promise<User | null>;
  deleteByIdAndClinic(userId: string, clinicId: string): Promise<boolean>;
}
