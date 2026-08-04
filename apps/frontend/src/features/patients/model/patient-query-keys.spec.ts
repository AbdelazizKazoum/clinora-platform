import { patientQueryKeys } from './patient-query-keys';

describe('patientQueryKeys', () => {
  it('scopes patient lists by clinic and every server-side filter', () => {
    expect(
      patientQueryKeys.list({
        clinicId: 'clinic-a',
        limit: 8,
        page: 1,
        search: 'sara',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'ACTIVE',
      }),
    ).toEqual([
      'patients',
      'clinic',
      { clinicId: 'clinic-a' },
      'list',
      {
        createdFrom: undefined,
        createdTo: undefined,
        gender: undefined,
        isNew: undefined,
        limit: 8,
        page: 1,
        search: 'sara',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'ACTIVE',
      },
    ]);
  });
});
