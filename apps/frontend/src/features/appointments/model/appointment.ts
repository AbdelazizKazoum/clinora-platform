export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'NO_SHOW',
  'COMPLETED',
] as const;

export const BOOKING_CHANNELS = ['ONLINE', 'WALK_IN', 'PHONE'] as const;

export const QUEUE_PRIORITIES = ['NORMAL', 'URGENT', 'EMERGENCY'] as const;

export const QUEUE_STATUSES = [
  'ARRIVED',
  'WAITING',
  'IN_CHAIR',
  'DONE',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];
export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  doctorId: string;
  doctorName: string;
  startAt: Date;
  endAt: Date;
  isEmergency: boolean;
  type: string | null;
  channel: BookingChannel;
  status: AppointmentStatus;
  notes: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const appointmentStatusLabels = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  COMPLETED: 'Completed',
} satisfies Record<AppointmentStatus, string>;

export const bookingChannelLabels = {
  ONLINE: 'Online',
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
} satisfies Record<BookingChannel, string>;

export const queuePriorityLabels = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
} satisfies Record<QueuePriority, string>;

export const queueStatusLabels = {
  ARRIVED: 'Arrived',
  WAITING: 'Waiting',
  IN_CHAIR: 'In Chair',
  DONE: 'Done',
} satisfies Record<QueueStatus, string>;

export const appointmentStatusBadgeClassNames = {
  PENDING: 'badge-soft-warning text-warning',
  CONFIRMED: 'badge-soft-success text-success',
  CANCELLED: 'badge-soft-danger text-danger',
  NO_SHOW: 'badge-soft-secondary text-secondary',
  COMPLETED: 'badge-soft-primary text-primary',
} satisfies Record<AppointmentStatus, string>;

export const appointmentStatusCalendarClassNames = {
  PENDING: 'bg-warning-subtle text-warning border-start border-3 border-warning',
  CONFIRMED: 'bg-success-subtle text-success border-start border-3 border-success',
  CANCELLED: 'bg-danger-subtle text-danger border-start border-3 border-danger',
  NO_SHOW:
    'bg-secondary-subtle text-secondary border-start border-3 border-secondary',
  COMPLETED: 'bg-primary-subtle text-primary border-start border-3 border-primary',
} satisfies Record<AppointmentStatus, string>;

export const appointmentStatusSidebarClassNames = {
  PENDING: 'bg-warning-subtle text-warning',
  CONFIRMED: 'bg-success-subtle text-success',
  CANCELLED: 'bg-danger-subtle text-danger',
  NO_SHOW: 'bg-secondary-subtle text-secondary',
  COMPLETED: 'bg-primary-subtle text-primary',
} satisfies Record<AppointmentStatus, string>;

export const appointmentStatusDotClassNames = {
  PENDING: 'bg-warning',
  CONFIRMED: 'bg-success',
  CANCELLED: 'bg-danger',
  NO_SHOW: 'bg-secondary',
  COMPLETED: 'bg-primary',
} satisfies Record<AppointmentStatus, string>;
