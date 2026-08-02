import { appointmentApiPaths } from './appointment-api-paths';

describe('appointmentApiPaths', () => {
  it('builds encoded BFF-relative appointment paths', () => {
    expect(appointmentApiPaths.appointments('clinic A/1')).toBe(
      '/clinics/clinic%20A%2F1/appointments',
    );
    expect(
      appointmentApiPaths.appointment('clinic A/1', 'appointment A/1'),
    ).toBe('/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1');
    expect(appointmentApiPaths.appointmentConflicts('clinic A/1')).toBe(
      '/clinics/clinic%20A%2F1/appointments/conflicts',
    );
    expect(
      appointmentApiPaths.appointmentTiming('clinic A/1', 'appointment A/1'),
    ).toBe(
      '/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1/timing',
    );
    expect(appointmentApiPaths.queueEntries('clinic A/1')).toBe(
      '/clinics/clinic%20A%2F1/queue',
    );
  });

  it('does not include direct Gateway API prefixes', () => {
    const paths = [
      appointmentApiPaths.appointments('clinic-1'),
      appointmentApiPaths.appointment('clinic-1', 'appointment-1'),
      appointmentApiPaths.appointmentConflicts('clinic-1'),
      appointmentApiPaths.appointmentTiming('clinic-1', 'appointment-1'),
      appointmentApiPaths.queueEntries('clinic-1'),
    ];

    expect(paths.every((path) => !path.includes('/api/v1'))).toBe(true);
    expect(paths.every((path) => !path.includes('/api/bff'))).toBe(true);
  });
});
