import type {
  CheckAppointmentConflictsQuery,
  ListAppointmentsQuery,
} from './appointment.queries';

const dateKey = (value: Date | undefined): string | undefined =>
  value?.toISOString();

export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  clinics: () => [...appointmentQueryKeys.all, 'clinic'] as const,
  clinic: (clinicId: string) =>
    [...appointmentQueryKeys.clinics(), { clinicId }] as const,
  lists: (clinicId: string) =>
    [...appointmentQueryKeys.clinic(clinicId), 'list'] as const,
  list: (query: ListAppointmentsQuery) =>
    [
      ...appointmentQueryKeys.lists(query.clinicId),
      {
        doctorId: query.doctorId,
        endDate: dateKey(query.endDate),
        limit: query.limit,
        page: query.page,
        startDate: dateKey(query.startDate),
        status: query.status,
      },
    ] as const,
  details: (clinicId: string) =>
    [...appointmentQueryKeys.clinic(clinicId), 'detail'] as const,
  detail: (clinicId: string, appointmentId: string) =>
    [...appointmentQueryKeys.details(clinicId), { appointmentId }] as const,
  conflicts: (clinicId: string) =>
    [...appointmentQueryKeys.clinic(clinicId), 'conflict'] as const,
  conflict: (query: CheckAppointmentConflictsQuery) =>
    [
      ...appointmentQueryKeys.conflicts(query.clinicId),
      {
        doctorId: query.doctorId,
        endAt: query.endAt.toISOString(),
        excludeAppointmentId: query.excludeAppointmentId,
        excludeStatus: query.excludeStatus,
        startAt: query.startAt.toISOString(),
      },
    ] as const,
};

export const appointmentQueueQueryKeys = {
  all: ['queue'] as const,
  clinics: () => [...appointmentQueueQueryKeys.all, 'clinic'] as const,
  clinic: (clinicId: string) =>
    [...appointmentQueueQueryKeys.clinics(), { clinicId }] as const,
  lists: (clinicId: string) =>
    [...appointmentQueueQueryKeys.clinic(clinicId), 'list'] as const,
};
