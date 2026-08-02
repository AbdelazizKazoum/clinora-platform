import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Brackets, Repository} from "typeorm";
import {
  AppointmentListResponse,
  CreateAppointmentInput,
  IAppointmentRepository,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from "../../../domain/repositories/appointment-repository.interface";
import {Appointment} from "../../../domain/entities/appointment";
import {AppointmentStatus} from "../../../domain/enums/appointment-status.enum";
import {AppointmentTypeOrmEntity} from "../entities/appointment.typeorm-entity";
import {AppointmentMapper} from "../mappers/appointment.mapper";

@Injectable()
export class AppointmentRepository implements IAppointmentRepository {
  constructor(
    @InjectRepository(AppointmentTypeOrmEntity)
    private readonly repo: Repository<AppointmentTypeOrmEntity>,
  ) {}

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    this.assertValidTiming(input.startAt, input.endAt);

    const saved = await this.repo.save({
      clinic_id: input.clinicId,
      patient_id: input.patientId,
      patient_name: input.patientName,
      patient_phone: input.patientPhone ?? null,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      start_at: input.startAt,
      end_at: input.endAt,
      is_emergency: input.isEmergency,
      appointment_type: input.type ?? null,
      channel: input.channel,
      status: input.status ?? AppointmentStatus.PENDING,
      notes: input.notes ?? null,
      cancelled_at: null,
      cancellation_reason: null,
      created_by: input.createdBy ?? null,
    });

    return AppointmentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Appointment | null> {
    const entity = await this.repo.findOne({where: {id}});
    return entity ? AppointmentMapper.toDomain(entity) : null;
  }

  async findMany(query: ListAppointmentsQuery): Promise<AppointmentListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 50));

    const qb = this.repo
      .createQueryBuilder("a")
      .where("a.clinic_id = :clinicId", {clinicId: query.clinicId});

    if (query.startDate && query.endDate) {
      qb.andWhere("a.start_at < :endDate AND a.end_at > :startDate", {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } else {
      if (query.startDate)
        qb.andWhere("a.start_at >= :startDate", {
          startDate: query.startDate,
        });
      if (query.endDate)
        qb.andWhere("a.end_at <= :endDate", {endDate: query.endDate});
    }

    if (query.doctorId)
      qb.andWhere("a.doctor_id = :doctorId", {doctorId: query.doctorId});
    if (query.status) qb.andWhere("a.status = :status", {status: query.status});

    qb.orderBy("a.start_at", "ASC").addOrderBy("a.created_at", "ASC");
    qb.skip((page - 1) * limit).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    return {appointments: entities.map(AppointmentMapper.toDomain), total};
  }

  async update(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const existing = await this.repo.findOne({where: {id}});
    if (!existing) {
      throw new NotFoundException(`Appointment \"${id}\" not found`);
    }

    const startAt = input.startAt ?? existing.start_at;
    const endAt = input.endAt ?? existing.end_at;
    this.assertValidTiming(startAt, endAt);

    const saved = await this.repo.save({
      ...existing,
      ...(input.patientId !== undefined ? {patient_id: input.patientId} : {}),
      ...(input.patientName !== undefined
        ? {patient_name: input.patientName}
        : {}),
      ...(input.patientPhone !== undefined
        ? {patient_phone: input.patientPhone}
        : {}),
      ...(input.doctorId !== undefined ? {doctor_id: input.doctorId} : {}),
      ...(input.doctorName !== undefined ? {doctor_name: input.doctorName} : {}),
      ...(input.startAt !== undefined ? {start_at: input.startAt} : {}),
      ...(input.endAt !== undefined ? {end_at: input.endAt} : {}),
      ...(input.isEmergency !== undefined
        ? {is_emergency: input.isEmergency}
        : {}),
      ...(input.type !== undefined ? {appointment_type: input.type} : {}),
      ...(input.channel !== undefined ? {channel: input.channel} : {}),
      ...(input.status !== undefined ? {status: input.status} : {}),
      ...(input.notes !== undefined ? {notes: input.notes} : {}),
      ...(input.cancelledAt !== undefined
        ? {cancelled_at: input.cancelledAt}
        : {}),
      ...(input.cancellationReason !== undefined
        ? {cancellation_reason: input.cancellationReason}
        : {}),
    });

    return AppointmentMapper.toDomain(saved);
  }

  async checkConflicts(input: {
    clinicId?: string;
    doctorId: string;
    startAt: Date;
    endAt: Date;
    excludeStatus?: AppointmentStatus;
    excludeAppointmentId?: string;
  }): Promise<boolean> {
    this.assertValidTiming(input.startAt, input.endAt);

    const qb = this.repo
      .createQueryBuilder("a")
      .where("a.doctor_id = :doctorId", {doctorId: input.doctorId})
      .andWhere("a.start_at < :endAt AND a.end_at > :startAt", {
        startAt: input.startAt,
        endAt: input.endAt,
      })
      .andWhere(
        new Brackets((sqb) => {
          sqb
            .where("a.status != :cancelled", {
              cancelled: AppointmentStatus.CANCELLED,
            })
            .andWhere("a.status != :noShow", {
              noShow: AppointmentStatus.NO_SHOW,
            });
        }),
      );

    if (input.clinicId) {
      qb.andWhere("a.clinic_id = :clinicId", {clinicId: input.clinicId});
    }
    if (input.excludeStatus) {
      qb.andWhere("a.status != :excludeStatus", {
        excludeStatus: input.excludeStatus,
      });
    }
    if (input.excludeAppointmentId) {
      qb.andWhere("a.id != :excludeAppointmentId", {
        excludeAppointmentId: input.excludeAppointmentId,
      });
    }

    return (await qb.getCount()) > 0;
  }

  private assertValidTiming(startAt: Date, endAt: Date): void {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException("Appointment timing must be valid dates");
    }
    if (endAt <= startAt) {
      throw new ConflictException("Appointment end time must be after start time");
    }
  }
}
