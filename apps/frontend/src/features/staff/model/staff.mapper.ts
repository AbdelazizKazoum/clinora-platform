import type { StaffMemberResponseDto } from '../api/dto';
import type { StaffMember } from './staff';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;

const buildFullName = (firstName: string, lastName: string): string =>
  [firstName, lastName].filter(Boolean).join(' ');

export const mapStaffMemberFromDto = (
  dto: StaffMemberResponseDto,
): StaffMember => ({
  id: dto.id,
  clinicId: dto.clinicId,
  userId: dto.userId,
  role: dto.role,
  status: dto.status,
  firstName: dto.firstName,
  lastName: dto.lastName,
  fullName: buildFullName(dto.firstName, dto.lastName),
  phone: emptyStringToNull(dto.phone),
  email: dto.email,
  specialization: emptyStringToNull(dto.specialization),
  avatar: emptyStringToNull(dto.avatar),
  isActive: dto.isActive,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});
