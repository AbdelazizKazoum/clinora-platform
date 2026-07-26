import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'patient_insurances' })
@Index('IDX_patient_insurances_clinic_patient', ['clinicId', 'patientId'])
@Index('IDX_patient_insurances_clinic_provider', [
  'clinicId',
  'insuranceProviderId',
])
export class PatientInsuranceTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ name: 'patient_id', type: 'varchar', length: 36 })
  patientId!: string;

  @Column({
    name: 'insurance_provider_id',
    type: 'varchar',
    length: 36,
  })
  insuranceProviderId!: string;

  @Column({ name: 'policy_number', type: 'varchar', length: 100, nullable: true })
  policyNumber!: string | null;

  @Column({ name: 'member_id', type: 'varchar', length: 100, nullable: true })
  memberId!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
