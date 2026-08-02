export const APPOINTMENT_DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;

export type AppointmentDurationOption =
  (typeof APPOINTMENT_DURATION_OPTIONS)[number];

export const appointmentDurationLabels = {
  15: '15 min',
  30: '30 min',
  45: '45 min',
  60: '1 hour',
  90: '1.5 hours',
} satisfies Record<AppointmentDurationOption, string>;
