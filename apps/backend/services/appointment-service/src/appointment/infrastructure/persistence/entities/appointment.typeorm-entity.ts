import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {AppointmentStatus} from "../../../domain/enums/appointment-status.enum";
import {BookingChannel} from "../../../domain/enums/booking-channel.enum";

@Entity("appointments")
@Index("idx_appointments_clinic", ["clinic_id"])
@Index("idx_appointments_patient", ["clinic_id", "patient_id"])
@Index("idx_appointments_doctor_date", [
  "clinic_id",
  "doctor_id",
  "start_at",
  "end_at",
])
@Index("idx_appointments_status_date", ["clinic_id", "status", "start_at"])
@Index("idx_appointments_conflict_check", [
  "clinic_id",
  "doctor_id",
  "status",
  "start_at",
  "end_at",
])
@Index("idx_appointments_emergency", ["clinic_id", "is_emergency"])
export class AppointmentTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({name: "clinic_id", length: 36})
  clinic_id!: string;

  @Column({name: "patient_id", length: 36})
  patient_id!: string;

  @Column({name: "patient_name", length: 255})
  patient_name!: string;

  @Column({name: "patient_phone", length: 30, nullable: true, type: "varchar"})
  patient_phone!: string | null;

  @Column({name: "doctor_id", length: 36})
  doctor_id!: string;

  @Column({name: "doctor_name", length: 255})
  doctor_name!: string;

  @Column({name: "start_at", type: "datetime"})
  start_at!: Date;

  @Column({name: "end_at", type: "datetime"})
  end_at!: Date;

  @Column({name: "is_emergency", default: false})
  is_emergency!: boolean;

  @Column({
    name: "appointment_type",
    length: 100,
    nullable: true,
    type: "varchar",
  })
  appointment_type!: string | null;

  @Column({type: "enum", enum: BookingChannel})
  channel!: BookingChannel;

  @Column({
    type: "enum",
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Column({type: "text", nullable: true})
  notes!: string | null;

  @Column({name: "cancelled_at", type: "datetime", nullable: true})
  cancelled_at!: Date | null;

  @Column({name: "cancellation_reason", type: "text", nullable: true})
  cancellation_reason!: string | null;

  @Column({name: "created_by", length: 36, nullable: true, type: "varchar"})
  created_by!: string | null;

  @CreateDateColumn({name: "created_at"})
  created_at!: Date;

  @UpdateDateColumn({name: "updated_at"})
  updated_at!: Date;
}
