import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'insurance_templates' })
@Index('IDX_insurance_templates_clinic_provider', [
  'clinicId',
  'insuranceProviderId',
])
export class InsuranceTemplateTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({
    name: 'insurance_provider_id',
    type: 'varchar',
    length: 36,
  })
  insuranceProviderId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
