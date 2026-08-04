import { useQuery } from '@tanstack/react-query';

import { getWaitingRoomState, listWaitingRoomChairs } from '../../api';
import { waitingRoomQueryKeys } from '../../model';
import { useWaitingRoomChairs } from './use-waiting-room-chairs';
import { useWaitingRoomState } from './use-waiting-room-state';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../api', () => ({
  getWaitingRoomState: jest.fn(),
  listWaitingRoomChairs: jest.fn(),
}));

const useQueryMock = jest.mocked(useQuery);

describe('waiting-room query hooks', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue({} as never);
  });

  it('uses the clinic-scoped state query key', async () => {
    useWaitingRoomState('clinic-a');

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: waitingRoomQueryKeys.state('clinic-a'),
    });

    await options.queryFn();

    expect(getWaitingRoomState).toHaveBeenCalledWith('clinic-a');
  });

  it('uses the clinic-scoped chairs query key', async () => {
    useWaitingRoomChairs('clinic-a');

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: waitingRoomQueryKeys.chairs('clinic-a'),
    });

    await options.queryFn();

    expect(listWaitingRoomChairs).toHaveBeenCalledWith('clinic-a');
  });

  it('disables waiting-room queries without a clinic ID', () => {
    useWaitingRoomState(null);
    useWaitingRoomChairs(undefined);

    expect(useQueryMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ enabled: false }),
    );
    expect(useQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ enabled: false }),
    );
  });
});
