import { useQuery } from '@tanstack/react-query';

import { listPatients } from '../../api';
import { patientQueryKeys } from '../../model';
import { usePatientSearch } from './use-patient-search';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../api', () => ({
  listPatients: jest.fn(),
}));

const useQueryMock = jest.mocked(useQuery);

describe('usePatientSearch', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue({} as never);
    jest.mocked(listPatients).mockReset();
  });

  it('loads the eight newest active patients matching the keyword', async () => {
    const query = {
      clinicId: 'clinic-a',
      limit: 8,
      page: 1,
      search: 'Sara',
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      status: 'ACTIVE' as const,
    };
    jest.mocked(listPatients).mockResolvedValue({
      meta: { limit: 8, page: 1, total: 0, totalPages: 0 },
      patients: [],
    });

    usePatientSearch('clinic-a', '  Sara  ');

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
      staleTime: number;
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: patientQueryKeys.list(query),
      staleTime: 30_000,
    });

    await options.queryFn();

    expect(listPatients).toHaveBeenCalledWith(query);
  });

  it.each([
    [null, 'Sara'],
    ['clinic-a', 'S'],
    ['clinic-a', '   '],
  ])('does not search with clinic %p and keyword %p', (clinicId, keyword) => {
    usePatientSearch(clinicId, keyword);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
