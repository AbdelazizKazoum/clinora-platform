import { Patient } from '../../../domain/entities/patient';
import { PatientTypeOrmEntity } from '../entities/patient.typeorm-entity';

export class PatientMapper {
  static toDomain(entity: PatientTypeOrmEntity): Patient {
    return new Patient({
      id: entity.id,
      clinicId: entity.clinicId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      userId: entity.userId,
      phone: entity.phone,
      email: entity.email,
      dateOfBirth: entity.dateOfBirth
        ? new Date(`${entity.dateOfBirth}T00:00:00.000Z`)
        : null,
      gender: entity.gender,
      address: entity.address,
      notes: entity.notes,
      allergies: entity.allergies,
      chronicConditions: entity.chronicConditions,
      currentMedications: entity.currentMedications,
      medicalNotes: entity.medicalNotes,
      deletedAt: entity.deletedAt,
    });
  }
}
