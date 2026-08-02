import {
  appointmentQueryKeys,
  appointmentQueueQueryKeys,
} from './appointment-query-keys';

describe('appointment query keys', () => {
  it('scopes appointment list keys by clinic, range, and filters', () => {
    expect(
      appointmentQueryKeys.list({
        clinicId: 'clinic-a',
        page: 2,
        limit: 50,
        startDate: new Date('2026-08-03T00:00:00.000Z'),
        endDate: new Date('2026-08-04T00:00:00.000Z'),
        doctorId: 'doctor-1',
        status: 'CONFIRMED',
      }),
    ).toEqual([
      'appointments',
      'clinic',
      { clinicId: 'clinic-a' },
      'list',
      {
        doctorId: 'doctor-1',
        endDate: '2026-08-04T00:00:00.000Z',
        limit: 50,
        page: 2,
        startDate: '2026-08-03T00:00:00.000Z',
        status: 'CONFIRMED',
      },
    ]);
  });

  it('scopes appointment detail and conflict keys', () => {
    expect(appointmentQueryKeys.detail('clinic-a', 'appointment-1')).toEqual([
      'appointments',
      'clinic',
      { clinicId: 'clinic-a' },
      'detail',
      { appointmentId: 'appointment-1' },
    ]);

    expect(
      appointmentQueryKeys.conflict({
        clinicId: 'clinic-a',
        doctorId: 'doctor-1',
        startAt: new Date('2026-08-03T09:00:00.000Z'),
        endAt: new Date('2026-08-03T09:30:00.000Z'),
        excludeAppointmentId: 'appointment-1',
      }),
    ).toEqual([
      'appointments',
      'clinic',
      { clinicId: 'clinic-a' },
      'conflict',
      {
        doctorId: 'doctor-1',
        endAt: '2026-08-03T09:30:00.000Z',
        excludeAppointmentId: 'appointment-1',
        excludeStatus: undefined,
        startAt: '2026-08-03T09:00:00.000Z',
      },
    ]);
  });

  it('scopes queue keys by clinic', () => {
    expect(appointmentQueueQueryKeys.lists('clinic-a')).toEqual([
      'queue',
      'clinic',
      { clinicId: 'clinic-a' },
      'list',
    ]);
  });
});
