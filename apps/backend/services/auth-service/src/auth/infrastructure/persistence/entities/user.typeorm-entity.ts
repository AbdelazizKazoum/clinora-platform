import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../../domain/enums/user-role.enum';

@Entity({ name: 'users' })
@Unique('UQ_users_email_clinic_id', ['email', 'clinicId'])
export class UserTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
