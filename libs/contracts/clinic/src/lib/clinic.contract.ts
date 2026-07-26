import { resolve } from 'node:path';

import type { Observable } from 'rxjs';

export const CLINIC_PACKAGE_NAME = 'clinic';
export const CLINIC_SERVICE_NAME = 'ClinicService';
export const DEFAULT_CLINIC_ID =
  '10000000-0000-4000-8000-000000000001';

export const CLINIC_LOCALES = ['ar', 'fr', 'en'] as const;
export const STAFF_ROLES = [
  'SECRETARY',
  'DENTAL_ASSISTANT',
  'DOCTOR',
  'ADMIN',
] as const;
export const STAFF_STATUSES = ['active', 'on-leave', 'inactive'] as const;

export type ClinicLocale = (typeof CLINIC_LOCALES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export function resolveClinicProtoPath(): string {
  return resolve(
    process.env['CLINIC_PROTO_PATH'] ??
      'libs/contracts/clinic/src/lib/clinic.proto',
  );
}

export interface ClinicIdRequest {
  clinicId: string;
}

export interface ClinicReply {
  id: string;
  slug: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  locale: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicRequest {
  slug: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
  locale?: ClinicLocale;
}

export interface WorkingHoursEntry {
  id: string;
  clinicId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface WorkingHoursListReply {
  entries: WorkingHoursEntry[];
}

export interface UpsertWorkingHoursEntry {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export interface UpsertWorkingHoursRequest {
  clinicId: string;
  entries: UpsertWorkingHoursEntry[];
}

export interface StaffMemberReply {
  id: string;
  clinicId: string;
  userId: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  specialization: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetStaffMemberRequest {
  clinicId: string;
  userId: string;
}

export interface ListStaffMembersRequest {
  clinicId: string;
}

export interface StaffMembersReply {
  items: StaffMemberReply[];
}

export interface CreateStaffMemberRequest {
  clinicId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  specialization?: string;
  avatar?: string;
  password: string;
}

export interface UpdateStaffMemberRequest {
  clinicId: string;
  staffMemberId: string;
  role?: StaffRole;
  status?: StaffStatus;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface DeleteStaffMemberRequest {
  clinicId: string;
  staffMemberId: string;
}

export interface SuccessReply {
  success: boolean;
}

export interface ClinicServiceClient {
  getClinic(request: ClinicIdRequest): Observable<ClinicReply>;
  createClinic(request: CreateClinicRequest): Observable<ClinicReply>;
  getWorkingHours(
    request: ClinicIdRequest,
  ): Observable<WorkingHoursListReply>;
  upsertWorkingHours(
    request: UpsertWorkingHoursRequest,
  ): Observable<WorkingHoursListReply>;
  getStaffMember(
    request: GetStaffMemberRequest,
  ): Observable<StaffMemberReply>;
  listStaffMembers(
    request: ListStaffMembersRequest,
  ): Observable<StaffMembersReply>;
  createStaffMember(
    request: CreateStaffMemberRequest,
  ): Observable<StaffMemberReply>;
  updateStaffMember(
    request: UpdateStaffMemberRequest,
  ): Observable<StaffMemberReply>;
  deleteStaffMember(
    request: DeleteStaffMemberRequest,
  ): Observable<SuccessReply>;
}
