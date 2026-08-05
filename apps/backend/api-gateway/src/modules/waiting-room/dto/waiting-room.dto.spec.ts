import { validateSync } from 'class-validator';

import {
  AssignWaitingRoomChairDto,
  CreateWaitingRoomChairDto,
  ReorderWaitingRoomDto,
  UpdateWaitingRoomStatusDto,
} from './waiting-room.dto';

const validEntryId = '20000000-0000-4000-8000-000000000001';
const validChairId = '30000000-0000-4000-8000-000000000001';

function validationProperties(candidate: object): string[] {
  return validateSync(candidate).map((error) => error.property);
}

describe('waiting-room HTTP DTO validation', () => {
  it('accepts the status command fields used by the waiting-room board', () => {
    const dto = Object.assign(new UpdateWaitingRoomStatusDto(), {
      status: 'IN_CHAIR',
      chairId: validChairId,
      correctionReason: 'Patient was moved back by mistake',
      targetOrderedEntryIds: [validEntryId],
    });

    expect(validateSync(dto)).toEqual([]);
  });

  it('rejects invalid status, chair, and target ordering payloads', () => {
    const invalidStatus = Object.assign(new UpdateWaitingRoomStatusDto(), {
      status: 'READY',
    });
    const invalidChair = Object.assign(new AssignWaitingRoomChairDto(), {
      chairId: 'chair-1',
    });
    const invalidOrder = Object.assign(new UpdateWaitingRoomStatusDto(), {
      status: 'WAITING',
      targetOrderedEntryIds: [],
    });

    expect(validationProperties(invalidStatus)).toContain('status');
    expect(validationProperties(invalidChair)).toContain('chairId');
    expect(validationProperties(invalidOrder)).toContain(
      'targetOrderedEntryIds',
    );
  });

  it('rejects malformed manual reorder commands before orchestration', () => {
    const invalidMode = Object.assign(new ReorderWaitingRoomDto(), {
      mode: 'CUSTOM',
      status: 'WAITING',
      orderedEntryIds: [validEntryId],
    });
    const invalidEntryIds = Object.assign(new ReorderWaitingRoomDto(), {
      mode: 'MANUAL',
      status: 'WAITING',
      orderedEntryIds: ['queue-1'],
    });

    expect(validationProperties(invalidMode)).toContain('mode');
    expect(validationProperties(invalidEntryIds)).toContain('orderedEntryIds');
  });

  it('validates chair management shape without requiring optional fields', () => {
    const validCreate = Object.assign(new CreateWaitingRoomChairDto(), {
      name: 'Operatory 1',
    });
    const invalidCreate = Object.assign(new CreateWaitingRoomChairDto(), {
      name: 'x'.repeat(101),
      code: 'x'.repeat(51),
      isActive: 'yes',
    });

    expect(validateSync(validCreate)).toEqual([]);
    expect(validationProperties(invalidCreate)).toEqual(
      expect.arrayContaining(['name', 'code', 'isActive']),
    );
  });
});
