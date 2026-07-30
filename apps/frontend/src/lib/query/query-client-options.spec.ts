import { ApiError } from '@/lib/api';

import { shouldRetryQuery } from './query-client-options';

describe('shouldRetryQuery', () => {
  it.each([401, 403])(
    'does not retry authorization failures with status %s',
    (status) => {
      expect(shouldRetryQuery(0, new ApiError('Forbidden', status))).toBe(
        false,
      );
    },
  );

  it('retries transient errors conservatively', () => {
    expect(shouldRetryQuery(0, new Error('Network error'))).toBe(true);
    expect(shouldRetryQuery(1, new Error('Network error'))).toBe(true);
    expect(shouldRetryQuery(2, new Error('Network error'))).toBe(false);
  });
});
