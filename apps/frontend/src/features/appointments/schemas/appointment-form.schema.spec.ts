import type { AppointmentFormValues } from './appointment-form.schema';
import {
  calculateAppointmentFormEndAt,
  createAppointmentFormValues,
  formatAppointmentDateTimeLocalInputValue,
  mapAppointmentFormToCreateCommand,
  mapAppointmentFormToUpdateCommand,
  parseAppointmentDateTimeLocalInputValue,
  validateAppointmentForm,
} from './appointment-form.schema';

const validValues = (
  overrides: Partial<AppointmentFormValues> = {},
): AppointmentFormValues => ({
  patientId: 'patient-1',
  patientName: 'Nadia Benali',
  patientPhone: '+212600000000',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  type: 'Cleaning',
  status: 'PENDING',
  startAt: '2026-08-02T09:30',
  durationMinutes: 30,
  channel: 'PHONE',
  isEmergency: false,
  notes: 'Prefers morning appointments.',
  ...overrides,
});

describe('appointment form schema', () => {
  it('accepts valid appointment values', () => {
    expect(validateAppointmentForm(validValues())).toEqual({
      errors: {},
      isValid: true,
    });
  });

  it('requires an existing patient and doctor', () => {
    const result = validateAppointmentForm(
      validValues({
        doctorId: '',
        doctorName: '',
        patientId: '',
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.patientId).toBe('Choose an existing patient.');
    expect(result.errors.doctorId).toBe('Choose a doctor.');
  });

  it('requires a valid start time and duration option', () => {
    const result = validateAppointmentForm(
      validValues({
        durationMinutes: 25,
        startAt: 'invalid',
      } as Partial<AppointmentFormValues>),
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.startAt).toBe('Choose a valid start time.');
    expect(result.errors.durationMinutes).toBe('Choose a valid duration.');
    expect(result.errors.endAt).toBe('End time must be after the start time.');
  });

  it('derives end time from start time and selected duration', () => {
    const endAt = calculateAppointmentFormEndAt(
      validValues({
        durationMinutes: 45,
        startAt: '2026-08-02T09:15',
      }),
    );

    expect(formatAppointmentDateTimeLocalInputValue(endAt as Date)).toBe(
      '2026-08-02T10:00',
    );
  });

  it('round-trips local date time input values without UTC conversion', () => {
    const parsedDate = parseAppointmentDateTimeLocalInputValue(
      '2026-08-02T14:05',
    );

    expect(parsedDate).not.toBeNull();
    expect(formatAppointmentDateTimeLocalInputValue(parsedDate as Date)).toBe(
      '2026-08-02T14:05',
    );
  });

  it('creates empty values with the default provider selected', () => {
    const values = createAppointmentFormValues({
      defaultProvider: {
        avatar: null,
        colorClassName: 'bg-primary-subtle text-primary',
        doctorId: 'doctor-2',
        initials: 'AK',
        name: 'Dr. Amal Khatib',
      },
      startAt: new Date(2026, 7, 2, 11, 0),
    });

    expect(values).toMatchObject({
      doctorId: 'doctor-2',
      doctorName: 'Dr. Amal Khatib',
      durationMinutes: 30,
      startAt: '2026-08-02T11:00',
    });
  });

  it('maps form values into a create command with derived end time', () => {
    const command = mapAppointmentFormToCreateCommand(
      'clinic-1',
      validValues({
        notes: ' Bring x-rays ',
        patientPhone: '',
        type: ' Whitening ',
      }),
    );

    expect(command).toMatchObject({
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      patientName: 'Nadia Benali',
      patientPhone: null,
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      type: 'Whitening',
      notes: 'Bring x-rays',
      channel: 'PHONE',
      status: 'PENDING',
    });
    expect(formatAppointmentDateTimeLocalInputValue(command.startAt)).toBe(
      '2026-08-02T09:30',
    );
    expect(formatAppointmentDateTimeLocalInputValue(command.endAt)).toBe(
      '2026-08-02T10:00',
    );
  });

  it('maps form values into an update command for the selected appointment', () => {
    const appointment = {
      id: 'appointment-1',
      clinicId: 'clinic-1',
      patientId: 'patient-old',
      patientName: 'Old Patient',
      patientPhone: null,
      doctorId: 'doctor-old',
      doctorName: 'Old Doctor',
      startAt: new Date(2026, 7, 2, 8, 0),
      endAt: new Date(2026, 7, 2, 8, 30),
      isEmergency: false,
      type: null,
      channel: 'PHONE',
      status: 'PENDING',
      notes: null,
      cancelledAt: null,
      cancellationReason: null,
      createdBy: null,
      createdAt: new Date(2026, 7, 1, 10, 0),
      updatedAt: new Date(2026, 7, 1, 10, 0),
    } as const;

    const command = mapAppointmentFormToUpdateCommand(
      appointment,
      validValues({ durationMinutes: 60 }),
    );

    expect(command).toMatchObject({
      clinicId: 'clinic-1',
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      isEmergency: false,
    });
    expect(formatAppointmentDateTimeLocalInputValue(command.endAt as Date)).toBe(
      '2026-08-02T10:30',
    );
  });
});
