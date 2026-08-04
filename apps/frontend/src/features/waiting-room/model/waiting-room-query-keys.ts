export const waitingRoomQueryKeys = {
  all: ['waiting-room'] as const,
  clinics: () => [...waitingRoomQueryKeys.all, 'clinic'] as const,
  clinic: (clinicId: string) =>
    [...waitingRoomQueryKeys.clinics(), { clinicId }] as const,
  state: (clinicId: string) =>
    [...waitingRoomQueryKeys.clinic(clinicId), 'state'] as const,
  chairs: (clinicId: string) =>
    [...waitingRoomQueryKeys.clinic(clinicId), 'chairs'] as const,
};
