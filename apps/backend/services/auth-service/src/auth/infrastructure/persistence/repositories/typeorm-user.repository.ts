import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../../domain/entities/user';
import type {
  UpdateUserAvailabilityInput,
  UserRepository,
} from '../../../domain/repositories/user-repository.interface';
import { UserTypeOrmEntity } from '../entities/user.typeorm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repository: Repository<UserTypeOrmEntity>,
  ) {}

  async findByEmailAndClinic(
    email: string,
    clinicId: string,
  ): Promise<User | null> {
    const entity = await this.repository.findOneBy({ email, clinicId });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.repository.save(UserMapper.toPersistence(user));
    return UserMapper.toDomain(saved);
  }

  async updateAvailability(
    input: UpdateUserAvailabilityInput,
  ): Promise<User | null> {
    const entity = await this.repository.findOneBy({
      id: input.userId,
      clinicId: input.clinicId,
    });

    if (!entity) {
      return null;
    }

    const user = UserMapper.toDomain(entity).changeAvailability(input.isActive);
    const saved = await this.repository.save(UserMapper.toPersistence(user));

    return UserMapper.toDomain(saved);
  }
}
