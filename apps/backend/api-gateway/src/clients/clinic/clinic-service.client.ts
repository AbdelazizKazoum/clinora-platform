import type {
  CreateStaffMemberRequest,
  GetStaffMemberRequest,
  ListStaffMembersRequest,
  StaffMemberReply,
  StaffMembersReply,
  UpdateStaffMemberRequest,
} from '@clinora/contracts-clinic';

export const CLINIC_SERVICE_CLIENT = Symbol('CLINIC_SERVICE_CLIENT');
export const CLINIC_GRPC_CLIENT = Symbol('CLINIC_GRPC_CLIENT');

export interface ClinicServiceClient {
  getStaffMember(request: GetStaffMemberRequest): Promise<StaffMemberReply>;
  listStaffMembers(
    request: ListStaffMembersRequest,
  ): Promise<StaffMembersReply>;
  createStaffMember(
    request: CreateStaffMemberRequest,
  ): Promise<StaffMemberReply>;
  updateStaffMember(
    request: UpdateStaffMemberRequest,
  ): Promise<StaffMemberReply>;
}
