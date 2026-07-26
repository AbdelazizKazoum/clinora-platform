import { PatientInsurance } from '../../../domain/entities/patient-insurance';
import { PatientInsuranceTypeOrmEntity } from '../entities/patient-insurance.typeorm-entity';

export class PatientInsuranceMapper {
  static toDomain(entity: PatientInsuranceTypeOrmEntity): PatientInsurance {
    return new PatientInsurance({
      id: entity.id,
      clinicId: entity.clinicId,
      patientId: entity.patientId,
      insuranceProviderId: entity.insuranceProviderId,
      policyNumber: entity.policyNumber,
      memberId: entity.memberId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
