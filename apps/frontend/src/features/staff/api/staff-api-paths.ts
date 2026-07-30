const encodePathPart = (value: string): string => encodeURIComponent(value);

export const staffApiPaths = {
  staffMembers: (clinicId: string): string =>
    `/clinics/${encodePathPart(clinicId)}/staff`,
  staffMember: (clinicId: string, staffMemberId: string): string =>
    `${staffApiPaths.staffMembers(clinicId)}/${encodePathPart(staffMemberId)}`,
  staffMemberByUser: (clinicId: string, userId: string): string =>
    `${staffApiPaths.staffMembers(clinicId)}/by-user/${encodePathPart(userId)}`,
};
