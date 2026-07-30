import { staffQueryKeys } from './staff-query-keys';

describe('staffQueryKeys', () => {
  it('scopes list keys by clinic', () => {
    expect(staffQueryKeys.list('clinic-a')).toEqual([
      'staff',
      'list',
      { clinicId: 'clinic-a' },
    ]);
    expect(staffQueryKeys.list('clinic-b')).toEqual([
      'staff',
      'list',
      { clinicId: 'clinic-b' },
    ]);
  });
});
