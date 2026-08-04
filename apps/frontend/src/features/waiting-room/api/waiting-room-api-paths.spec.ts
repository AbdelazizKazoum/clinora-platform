import { waitingRoomApiPaths } from './waiting-room-api-paths';

describe('waitingRoomApiPaths', () => {
  it('builds encoded BFF-relative waiting-room paths', () => {
    expect(waitingRoomApiPaths.state('clinic A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room',
    );
    expect(waitingRoomApiPaths.entryStatus('clinic A/1', 'entry A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/status',
    );
    expect(waitingRoomApiPaths.entryNotes('clinic A/1', 'entry A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/notes',
    );
    expect(waitingRoomApiPaths.entryChair('clinic A/1', 'entry A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/chair',
    );
    expect(waitingRoomApiPaths.reorder('clinic A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room/reorder',
    );
    expect(waitingRoomApiPaths.chair('clinic A/1', 'chair A/1')).toBe(
      '/clinics/clinic%20A%2F1/waiting-room/chairs/chair%20A%2F1',
    );
  });

  it('keeps API client paths free from direct Gateway and BFF prefixes', () => {
    const paths = [
      waitingRoomApiPaths.state('clinic-1'),
      waitingRoomApiPaths.entryStatus('clinic-1', 'entry-1'),
      waitingRoomApiPaths.entryNotes('clinic-1', 'entry-1'),
      waitingRoomApiPaths.entryChair('clinic-1', 'entry-1'),
      waitingRoomApiPaths.reorder('clinic-1'),
      waitingRoomApiPaths.chairs('clinic-1'),
      waitingRoomApiPaths.chair('clinic-1', 'chair-1'),
    ];

    expect(paths.every((path) => !path.includes('/api/v1'))).toBe(true);
    expect(paths.every((path) => !path.includes('/api/bff'))).toBe(true);
  });

  it('builds the queue SSE path outside the BFF proxy prefix', () => {
    expect(waitingRoomApiPaths.queueEvents('clinic A/1')).toBe(
      '/events/queue?clinicId=clinic%20A%2F1',
    );
  });
});
