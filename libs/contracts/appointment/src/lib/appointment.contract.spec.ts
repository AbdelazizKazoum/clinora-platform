import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  WAITING_ROOM_ORDERING_MODES,
  type WaitingRoomStateReply,
} from './appointment.contract';

describe('appointment waiting-room contract', () => {
  it('exposes the waiting-room ordering modes used by service clients', () => {
    expect(WAITING_ROOM_ORDERING_MODES).toEqual(['AUTO', 'MANUAL']);
  });

  it('keeps the proto service surface aligned with the waiting-room API shape', () => {
    const proto = readFileSync(join(__dirname, 'appointment.proto'), 'utf8');

    expect(proto).toContain(
      'rpc GetWaitingRoomState (GetWaitingRoomStateRequest) returns (WaitingRoomStateReply);',
    );
    expect(proto).toContain(
      'rpc UpdateWaitingRoomStatus (UpdateWaitingRoomStatusRequest) returns (QueueEntryReply);',
    );
    expect(proto).toContain(
      'rpc AssignWaitingRoomChair (AssignWaitingRoomChairRequest) returns (QueueEntryReply);',
    );
    expect(proto).toContain(
      'rpc ReorderWaitingRoomEntries (ReorderWaitingRoomEntriesRequest) returns (QueueEntriesListReply);',
    );
    expect(proto).toContain('string chair_id = 18;');
    expect(proto).toContain('string chair_name = 19;');
    expect(proto).toContain('optional int32 manual_order = 20;');
  });

  it('types waiting-room state replies with chairs and ordering metadata', () => {
    const reply: WaitingRoomStateReply = {
      entries: [],
      chairs: [
        {
          id: 'chair-1',
          clinicId: 'clinic-1',
          name: 'Operatory 1',
          code: 'OP-1',
          isActive: true,
          isAvailable: false,
          occupiedByEntryId: 'queue-1',
          createdAt: '2026-08-04T08:00:00.000Z',
          updatedAt: '2026-08-04T08:00:00.000Z',
        },
      ],
      ordering: {
        mode: 'MANUAL',
        manualStatuses: ['WAITING'],
      },
      generatedAt: '2026-08-04T08:00:00.000Z',
    };

    expect(reply.ordering.mode).toBe('MANUAL');
    expect(reply.chairs[0].occupiedByEntryId).toBe('queue-1');
  });
});
