'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

import WaitingRoomBoard, {
  WaitingRoomBoardEmptyState,
  WaitingRoomBoardSkeleton,
} from '../components/waiting-room-board';
import WaitingRoomSummaryCards, {
  WaitingRoomSummarySkeleton,
} from '../components/waiting-room-summary-cards';
import WaitingRoomToolbar from '../components/waiting-room-toolbar';
import { useWaitingRoomEvents, useWaitingRoomState } from '../hooks';
import {
  filterWaitingRoomEntries,
  getWaitingRoomDoctorOptions,
  getWaitingRoomSummary,
  type WaitingRoomPriorityFilter,
} from '../model';

const WaitingRoomPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<WaitingRoomPriorityFilter>('ALL');
  const [doctorId, setDoctorId] = useState<string | 'ALL'>('ALL');
  const waitingRoomStateQuery = useWaitingRoomState(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  useWaitingRoomEvents(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  const entries = waitingRoomStateQuery.data?.entries ?? [];
  const doctors = useMemo(
    () => getWaitingRoomDoctorOptions(entries),
    [entries],
  );
  const summary = useMemo(() => getWaitingRoomSummary(entries), [entries]);
  const filteredEntries = useMemo(
    () =>
      filterWaitingRoomEntries(entries, {
        doctorId,
        priority,
        search,
      }),
    [doctorId, entries, priority, search],
  );
  const hasActiveFilters =
    search.trim().length > 0 || priority !== 'ALL' || doctorId !== 'ALL';
  const isInitialLoading =
    sessionStatus === 'loading' ||
    (waitingRoomStateQuery.isLoading && !waitingRoomStateQuery.data);
  const isBackgroundFetching =
    !isInitialLoading && waitingRoomStateQuery.isFetching;
  const hasInitialError =
    waitingRoomStateQuery.isError && !waitingRoomStateQuery.data;

  const clearFilters = () => {
    setSearch('');
    setPriority('ALL');
    setDoctorId('ALL');
  };

  return (
    <>
      <PageBreadcrumb title="Waiting Room" subtitle="Clinical" />

      {!clinicId && sessionStatus === 'authenticated' && (
        <Alert variant="warning">
          This session is missing a clinic context. The waiting room cannot be
          loaded.
        </Alert>
      )}

      {waitingRoomStateQuery.isError && (
        <Alert
          className="d-flex flex-wrap align-items-center justify-content-between gap-2"
          variant="danger"
        >
          <span>
            {waitingRoomStateQuery.error.message ||
              'Unable to load the waiting room.'}
          </span>
          <Button
            disabled={waitingRoomStateQuery.isFetching}
            onClick={() => {
              void waitingRoomStateQuery.refetch();
            }}
            size="sm"
            variant="outline-danger"
          >
            <Icon icon="refresh-cw" className="me-1" />
            Retry
          </Button>
        </Alert>
      )}

      {isInitialLoading ? (
        <>
          <WaitingRoomSummarySkeleton />
          <WaitingRoomBoardSkeleton />
        </>
      ) : clinicId && !hasInitialError ? (
        <>
          <WaitingRoomSummaryCards summary={summary} />

          <div className="outlook-box kanban-app mb-3">
            <Card className="h-100 mb-0 flex-grow-1 overflow-hidden">
              <WaitingRoomToolbar
                doctorId={doctorId}
                doctors={doctors}
                hasActiveFilters={hasActiveFilters}
                isRefreshing={isBackgroundFetching}
                manualStatuses={
                  waitingRoomStateQuery.data?.ordering.manualStatuses ?? []
                }
                onClearFilters={clearFilters}
                onDoctorIdChange={setDoctorId}
                onPriorityChange={setPriority}
                onRefresh={() => {
                  void waitingRoomStateQuery.refetch();
                }}
                onSearchChange={setSearch}
                orderingMode={
                  waitingRoomStateQuery.data?.ordering.mode ?? 'AUTO'
                }
                priority={priority}
                search={search}
              />

              {entries.length === 0 ? (
                <WaitingRoomBoardEmptyState
                  filtered={false}
                  onClearFilters={clearFilters}
                />
              ) : filteredEntries.length === 0 ? (
                <WaitingRoomBoardEmptyState
                  filtered
                  onClearFilters={clearFilters}
                />
              ) : (
                <WaitingRoomBoard
                  entries={filteredEntries}
                  manualStatuses={
                    waitingRoomStateQuery.data?.ordering.manualStatuses ?? []
                  }
                />
              )}
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
};

export default WaitingRoomPage;
