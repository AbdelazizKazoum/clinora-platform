import {
  APPOINTMENT_DEFAULT_DURATION_MINUTES,
  APPOINTMENT_DURATION_OPTIONS,
  APPOINTMENT_STATUSES,
  BOOKING_CHANNELS,
  calculateDurationMinutes,
  calculateEndAtFromDuration,
  isValidAppointmentTiming,
  type Appointment,
  type AppointmentDurationOption,
  type AppointmentProvider,
  type AppointmentStatus,
  type BookingChannel,
  type CreateAppointmentCommand,
  type UpdateAppointmentCommand,
} from '../model';

export interface AppointmentFormValues {
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  type: string;
  status: AppointmentStatus;
  startAt: string;
  durationMinutes: AppointmentDurationOption;
  channel: BookingChannel;
  isEmergency: boolean;
  notes: string;
}

export type AppointmentFormField = keyof AppointmentFormValues;

export type AppointmentFormErrors = Partial<
  Record<AppointmentFormField | 'endAt' | 'form', string>
>;

export interface AppointmentFormValidationResult {
  errors: AppointmentFormErrors;
  isValid: boolean;
}

const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const hasMaxLength = (value: string, maxLength: number): boolean =>
  value.trim().length <= maxLength;

const isAppointmentStatus = (value: string): value is AppointmentStatus =>
  APPOINTMENT_STATUSES.includes(value as AppointmentStatus);

const isBookingChannel = (value: string): value is BookingChannel =>
  BOOKING_CHANNELS.includes(value as BookingChannel);

const isDurationOption = (value: number): value is AppointmentDurationOption =>
  APPOINTMENT_DURATION_OPTIONS.includes(value as AppointmentDurationOption);

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

export const formatAppointmentDateTimeLocalInputValue = (date: Date): string => {
  if (!Number.isFinite(date.getTime())) return '';

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-') +
    `T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
};

export const parseAppointmentDateTimeLocalInputValue = (
  value: string,
): Date | null => {
  const match = localDateTimePattern.exec(value);

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day) ||
    parsedDate.getHours() !== Number(hour) ||
    parsedDate.getMinutes() !== Number(minute)
  ) {
    return null;
  }

  return parsedDate;
};

export const calculateAppointmentFormEndAt = (
  values: Pick<AppointmentFormValues, 'durationMinutes' | 'startAt'>,
): Date | null => {
  const startAt = parseAppointmentDateTimeLocalInputValue(values.startAt);

  if (!startAt || !isDurationOption(values.durationMinutes)) return null;

  return calculateEndAtFromDuration(startAt, values.durationMinutes);
};

export const createAppointmentFormValues = (
  options: {
    appointment?: Appointment | null;
    defaultProvider?: AppointmentProvider | null;
    startAt?: Date;
  } = {},
): AppointmentFormValues => {
  const appointment = options.appointment;
  const startAt = options.startAt ?? new Date();
  const appointmentDuration = appointment
    ? calculateDurationMinutes(appointment.startAt, appointment.endAt)
    : APPOINTMENT_DEFAULT_DURATION_MINUTES;
  const durationMinutes = isDurationOption(appointmentDuration)
    ? appointmentDuration
    : APPOINTMENT_DEFAULT_DURATION_MINUTES;

  return {
    patientId: appointment?.patientId ?? '',
    patientName: appointment?.patientName ?? '',
    patientPhone: appointment?.patientPhone ?? '',
    doctorId: appointment?.doctorId ?? options.defaultProvider?.doctorId ?? '',
    doctorName:
      appointment?.doctorName ?? options.defaultProvider?.name ?? '',
    type: appointment?.type ?? '',
    status: appointment?.status ?? 'PENDING',
    startAt: formatAppointmentDateTimeLocalInputValue(
      appointment?.startAt ?? startAt,
    ),
    durationMinutes,
    channel: appointment?.channel ?? 'PHONE',
    isEmergency: appointment?.isEmergency ?? false,
    notes: appointment?.notes ?? '',
  };
};

export const validateAppointmentForm = (
  values: AppointmentFormValues,
): AppointmentFormValidationResult => {
  const errors: AppointmentFormErrors = {};
  const patientId = values.patientId.trim();
  const patientName = values.patientName.trim();
  const patientPhone = values.patientPhone.trim();
  const doctorId = values.doctorId.trim();
  const doctorName = values.doctorName.trim();
  const type = values.type.trim();
  const notes = values.notes.trim();
  const startAt = parseAppointmentDateTimeLocalInputValue(values.startAt);
  const endAt = calculateAppointmentFormEndAt(values);

  if (!patientId) {
    errors.patientId = 'Choose an existing patient.';
  } else if (!hasMaxLength(patientId, 100)) {
    errors.patientId = 'Patient ID must be 100 characters or fewer.';
  }

  if (!patientName) {
    errors.patientName = 'Patient name is required.';
  } else if (!hasMaxLength(patientName, 255)) {
    errors.patientName = 'Patient name must be 255 characters or fewer.';
  }

  if (patientPhone && !hasMaxLength(patientPhone, 30)) {
    errors.patientPhone = 'Phone number must be 30 characters or fewer.';
  }

  if (!doctorId || !doctorName) {
    errors.doctorId = 'Choose a doctor.';
  } else if (!hasMaxLength(doctorId, 100)) {
    errors.doctorId = 'Doctor ID must be 100 characters or fewer.';
  }

  if (!isAppointmentStatus(values.status)) {
    errors.status = 'Choose a valid status.';
  }

  if (!isBookingChannel(values.channel)) {
    errors.channel = 'Choose a valid booking channel.';
  }

  if (!startAt) {
    errors.startAt = 'Choose a valid start time.';
  }

  if (!isDurationOption(values.durationMinutes)) {
    errors.durationMinutes = 'Choose a valid duration.';
  }

  if (!endAt || !startAt || !isValidAppointmentTiming(startAt, endAt)) {
    errors.endAt = 'End time must be after the start time.';
  }

  if (type && !hasMaxLength(type, 120)) {
    errors.type = 'Service must be 120 characters or fewer.';
  }

  if (notes && !hasMaxLength(notes, 1000)) {
    errors.notes = 'Notes must be 1000 characters or fewer.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const trimOptionalString = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

const resolveAppointmentFormTiming = (
  values: AppointmentFormValues,
): { endAt: Date; startAt: Date } => {
  const startAt = parseAppointmentDateTimeLocalInputValue(values.startAt);
  const endAt = calculateAppointmentFormEndAt(values);

  if (!startAt || !endAt || !isValidAppointmentTiming(startAt, endAt)) {
    throw new RangeError('Appointment timing is invalid.');
  }

  return { endAt, startAt };
};

export const mapAppointmentFormToCreateCommand = (
  clinicId: string,
  values: AppointmentFormValues,
): CreateAppointmentCommand => {
  const timing = resolveAppointmentFormTiming(values);

  return {
    clinicId,
    patientId: values.patientId.trim(),
    patientName: values.patientName.trim(),
    patientPhone: trimOptionalString(values.patientPhone),
    doctorId: values.doctorId.trim(),
    doctorName: values.doctorName.trim(),
    startAt: timing.startAt,
    endAt: timing.endAt,
    isEmergency: values.isEmergency,
    type: trimOptionalString(values.type),
    channel: values.channel,
    status: values.status,
    notes: trimOptionalString(values.notes),
  };
};

export const mapAppointmentFormToUpdateCommand = (
  appointment: Appointment,
  values: AppointmentFormValues,
): UpdateAppointmentCommand => {
  const timing = resolveAppointmentFormTiming(values);

  return {
    clinicId: appointment.clinicId,
    appointmentId: appointment.id,
    patientId: values.patientId.trim(),
    patientName: values.patientName.trim(),
    patientPhone: trimOptionalString(values.patientPhone),
    doctorId: values.doctorId.trim(),
    doctorName: values.doctorName.trim(),
    startAt: timing.startAt,
    endAt: timing.endAt,
    isEmergency: values.isEmergency,
    type: trimOptionalString(values.type),
    channel: values.channel,
    status: values.status,
    notes: trimOptionalString(values.notes),
  };
};
