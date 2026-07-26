import { User } from '../entities/user';

export interface UserRepository {
  findByEmailAndClinic(email: string, clinicId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
