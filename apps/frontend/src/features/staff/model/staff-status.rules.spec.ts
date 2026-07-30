import {
  getAvailableStaffStatusTransitions,
  getEditableStaffStatusOptions,
  isStaffDeactivationStatus,
} from './staff-status.rules';

describe('staff status rules', () => {
  it('presents only valid status transitions', () => {
    expect(getAvailableStaffStatusTransitions('active')).toEqual([
      'on-leave',
      'inactive',
    ]);
    expect(getAvailableStaffStatusTransitions('on-leave')).toEqual([
      'active',
      'inactive',
    ]);
    expect(getAvailableStaffStatusTransitions('inactive')).toEqual(['active']);
  });

  it('keeps the current status selectable in edit forms', () => {
    expect(getEditableStaffStatusOptions('inactive')).toEqual([
      'inactive',
      'active',
    ]);
  });

  it('identifies account deactivation transitions', () => {
    expect(isStaffDeactivationStatus('inactive')).toBe(true);
    expect(isStaffDeactivationStatus('on-leave')).toBe(false);
  });
});
