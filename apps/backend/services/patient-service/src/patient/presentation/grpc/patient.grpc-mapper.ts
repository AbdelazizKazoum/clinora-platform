import type {
  PatientListItem,
  PatientReply,
} from '@clinora/contracts-patient';

import { InsuranceProvider } from '../../domain/entities/insurance-provider';
import { InsuranceTemplate } from '../../domain/entities/insurance-template';
import { Patient } from '../../domain/entities/patient';
import { PatientDocument } from '../../domain/entities/patient-document';
import { PatientInsurance } from '../../domain/entities/patient-insurance';

function date(value: Date | null): string {
  return value?.toISOString() ?? '';
}

export class PatientGrpcMapper {
  static patient(patient: Patient): PatientReply {
    const value = patient.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      firstName: value.firstName,
      lastName: value.lastName,
      status: value.status,
      userId: value.userId ?? '',
      phone: value.phone ?? '',
      email: value.email ?? '',
      dateOfBirth: date(value.dateOfBirth),
      gender: value.gender ?? '',
      address: value.address ?? '',
      notes: value.notes ?? '',
      allergies: value.allergies ?? '',
      chronicConditions: value.chronicConditions ?? '',
      currentMedications: value.currentMedications ?? '',
      medicalNotes: value.medicalNotes ?? '',
      deletedAt: date(value.deletedAt),
      createdAt: date(value.createdAt),
      updatedAt: date(value.updatedAt),
    };
  }

  static patientListItem(patient: Patient): PatientListItem {
    const value = patient.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      firstName: value.firstName,
      lastName: value.lastName,
      fullName: patient.fullName,
      status: value.status,
      phone: value.phone ?? '',
      email: value.email ?? '',
      dateOfBirth: date(value.dateOfBirth),
      gender: value.gender ?? '',
      createdAt: date(value.createdAt),
      updatedAt: date(value.updatedAt),
    };
  }

  static provider(provider: InsuranceProvider) {
    const value = provider.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      name: value.name,
      code: value.code ?? '',
      isActive: value.isActive,
      createdAt: date(value.createdAt),
      updatedAt: date(value.updatedAt),
    };
  }

  static template(template: InsuranceTemplate) {
    const value = template.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      insuranceProviderId: value.insuranceProviderId,
      name: value.name,
      fileUrl: value.fileUrl,
      createdAt: date(value.createdAt),
    };
  }

  static insurance(insurance: PatientInsurance) {
    const value = insurance.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      patientId: value.patientId,
      insuranceProviderId: value.insuranceProviderId,
      policyNumber: value.policyNumber ?? '',
      memberId: value.memberId ?? '',
      isActive: value.isActive,
      createdAt: date(value.createdAt),
      updatedAt: date(value.updatedAt),
    };
  }

  static document(document: PatientDocument) {
    const value = document.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      patientId: value.patientId,
      type: value.type,
      title: value.title ?? '',
      fileUrl: value.fileUrl,
      createdAt: date(value.createdAt),
    };
  }
}
