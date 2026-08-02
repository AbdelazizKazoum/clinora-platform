export {
  APPOINTMENT_STATUSES,
  BOOKING_CHANNELS,
  QUEUE_PRIORITIES,
  QUEUE_STATUSES,
  appointmentStatusBadgeClassNames,
  appointmentStatusCalendarClassNames,
  appointmentStatusDotClassNames,
  appointmentStatusLabels,
  bookingChannelLabels,
  queuePriorityLabels,
  queueStatusLabels,
  type Appointment,
  type AppointmentStatus,
  type BookingChannel,
  type QueuePriority,
  type QueueStatus,
} from './appointment';
export {
  APPOINTMENT_DURATION_OPTIONS,
  appointmentDurationLabels,
  type AppointmentDurationOption,
} from './appointment-duration';
export { type CheckInAppointmentCommand } from './appointment.commands';
export {
  mapAppointmentFromDto,
  mapAppointmentsListFromDto,
  mapCheckInAppointmentCommandToDto,
} from './appointment.mapper';
export {
  appointmentsOverlap,
  calculateDurationMinutes,
  calculateEndAtFromDuration,
  canCheckInAppointment,
  isBlockingAppointment,
  isBlockingOverlap,
  isValidAppointmentTiming,
} from './appointment.rules';
