import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StaffMember } from '../../../domain/entities/staff-member';
import { StaffStatus } from '../../../domain/enums/staff-status.enum';
import type {
  CreateStaffMember,
  StaffMemberRepository,
  UpdateStaffMember,
} from '../../../domain/repositories/staff-member-repository.interface';
import { StaffMemberTypeOrmEntity } from '../entities/staff-member.typeorm-entity';
import { StaffMemberMapper } from '../mappers/staff-member.mapper';
import { rethrowPersistenceError } from './persistence-error';

@Injectable()
export class TypeOrmStaffMemberRepository
  implements StaffMemberRepository
{
  constructor(
    @InjectRepository(StaffMemberTypeOrmEntity)
    private readonly repository: Repository<StaffMemberTypeOrmEntity>,
  ) {}

  async create(input: CreateStaffMember): Promise<StaffMember> {
    const entity = this.repository.create({
      id: randomUUID(),
      clinicId: input.clinicId,
      userId: input.userId,
      role: input.role,
      status: StaffStatus.Active,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email.trim().toLowerCase(),
      specialization: input.specialization?.trim() || null,
      avatar: input.avatar?.trim() || null,
      isActive: true,
    });
    try {
      return StaffMemberMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async findById(
    clinicId: string,
    id: string,
  ): Promise<StaffMember | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    return entity ? StaffMemberMapper.toDomain(entity) : null;
  }

  async findByUserId(
    clinicId: string,
    userId: string,
  ): Promise<StaffMember | null> {
    const entity = await this.repository.findOneBy({ clinicId, userId });
    return entity ? StaffMemberMapper.toDomain(entity) : null;
  }

  async findByEmail(
    clinicId: string,
    email: string,
  ): Promise<StaffMember | null> {
    const entity = await this.repository.findOneBy({
      clinicId,
      email: email.trim().toLowerCase(),
    });
    return entity ? StaffMemberMapper.toDomain(entity) : null;
  }

  async list(clinicId: string): Promise<StaffMember[]> {
    const entities = await this.repository.find({
      where: { clinicId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return entities.map(StaffMemberMapper.toDomain);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateStaffMember,
  ): Promise<StaffMember | null> {
    const entity = await this.repository.findOneBy({ clinicId, id });
    if (!entity) {
      return null;
    }
    if (input.role !== undefined) entity.role = input.role;
    if (input.status !== undefined) entity.status = input.status;
    if (input.firstName !== undefined) {
      entity.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      entity.lastName = input.lastName.trim();
    }
    if (input.phone !== undefined) entity.phone = input.phone;
    if (input.email !== undefined) {
      entity.email = input.email.trim().toLowerCase();
    }
    if (input.specialization !== undefined) {
      entity.specialization = input.specialization;
    }
    if (input.avatar !== undefined) entity.avatar = input.avatar;
    if (input.isActive !== undefined) entity.isActive = input.isActive;

    try {
      return StaffMemberMapper.toDomain(
        await this.repository.save(entity),
      );
    } catch (error: unknown) {
      rethrowPersistenceError(error);
    }
  }

  async delete(clinicId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({ clinicId, id });
    return (result.affected ?? 0) > 0;
  }
}
