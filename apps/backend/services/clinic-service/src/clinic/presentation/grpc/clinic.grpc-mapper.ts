import type {
  ClinicReply,
  StaffMemberReply,
  WorkingHoursEntry,
} from '@clinora/contracts-clinic';

import { Clinic } from '../../domain/entities/clinic';
import { StaffMember } from '../../domain/entities/staff-member';
import { WorkingHours } from '../../domain/entities/working-hours';

export class ClinicGrpcMapper {
  static clinic(clinic: Clinic): ClinicReply {
    const value = clinic.properties;
    return {
      id: value.id,
      slug: value.slug,
      name: value.name,
      phone: value.phone ?? '',
      email: value.email ?? '',
      address: value.address ?? '',
      timezone: value.timezone,
      locale: value.locale,
      isActive: value.isActive,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }

  static workingHours(hours: WorkingHours): WorkingHoursEntry {
    const value = hours.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      dayOfWeek: value.dayOfWeek,
      openTime: value.openTime ?? '',
      closeTime: value.closeTime ?? '',
      isClosed: value.isClosed,
    };
  }

  static staffMember(member: StaffMember): StaffMemberReply {
    const value = member.properties;
    return {
      id: value.id,
      clinicId: value.clinicId,
      userId: value.userId,
      role: value.role,
      status: value.status,
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone ?? '',
      email: value.email,
      specialization: value.specialization ?? '',
      avatar: value.avatar ?? '',
      isActive: value.isActive,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }
}
