export interface StaffSnapshot {
  userId: string;
  clinicId: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface ClinicServicePort {
  getStaffMember(userId: string, clinicId: string): Promise<StaffSnapshot>;
}
