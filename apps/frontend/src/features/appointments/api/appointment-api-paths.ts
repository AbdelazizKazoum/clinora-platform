const encodePathPart = (value: string): string => encodeURIComponent(value);

export const appointmentApiPaths = {
  appointments: (clinicId: string): string =>
    `/clinics/${encodePathPart(clinicId)}/appointments`,
  appointment: (clinicId: string, appointmentId: string): string =>
    `${appointmentApiPaths.appointments(clinicId)}/${encodePathPart(
      appointmentId,
    )}`,
  appointmentConflicts: (clinicId: string): string =>
    `${appointmentApiPaths.appointments(clinicId)}/conflicts`,
  appointmentTiming: (clinicId: string, appointmentId: string): string =>
    `${appointmentApiPaths.appointment(clinicId, appointmentId)}/timing`,
  queueEntries: (clinicId: string): string =>
    `/clinics/${encodePathPart(clinicId)}/queue`,
};
