'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { useNotificationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

import WaitingRoomBoard, {
  WaitingRoomBoardEmptyState,
  WaitingRoomBoardSkeleton,
} from '../components/waiting-room-board';
import WaitingRoomCorrectionModal from '../components/waiting-room-correction-modal';
import WaitingRoomSummaryCards, {
  WaitingRoomSummarySkeleton,
} from '../components/waiting-room-summary-cards';
import WaitingRoomToolbar from '../components/waiting-room-toolbar';
import {
  useReorderWaitingRoomEntries,
  useUpdateWaitingRoomStatus,
  useWaitingRoomEvents,
  useWaitingRoomState,
} from '../hooks';
import {
  filterWaitingRoomEntries,
  getWaitingRoomDoctorOptions,
  getWaitingRoomSummary,
  projectWaitingRoomBoardMove,
  queueStatusLabels,
  requiresQueueStatusCorrectionReason,
  waitingRoomStatusFlow,
  type WaitingRoomBoardMove,
  type WaitingRoomBoardMoveInput,
  type WaitingRoomEntry,
  type WaitingRoomPriorityFilter,
} from '../model';

const getMoveErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Unable to save the waiting-room movement.';

const WaitingRoomPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<WaitingRoomPriorityFilter>('ALL');
  const [doctorId, setDoctorId] = useState<string | 'ALL'>('ALL');
  const [manualOrderingRequested, setManualOrderingRequested] = useState(false);
  const [optimisticEntries, setOptimisticEntries] = useState<
    WaitingRoomEntry[] | null
  >(null);
  const [isPersistingBoard, setIsPersistingBoard] = useState(false);
  const [pendingCorrectionMove, setPendingCorrectionMove] =
    useState<WaitingRoomBoardMove | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const reorderMutation = useReorderWaitingRoomEntries();
  const statusMutation = useUpdateWaitingRoomStatus();
  const waitingRoomStateQuery = useWaitingRoomState(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  useWaitingRoomEvents(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  const entries = waitingRoomStateQuery.data?.entries ?? [];
  const boardEntries = optimisticEntries ?? entries;
  const doctors = useMemo(
    () => getWaitingRoomDoctorOptions(boardEntries),
    [boardEntries],
  );
  const summary = useMemo(
    () => getWaitingRoomSummary(boardEntries),
    [boardEntries],
  );
  const filteredEntries = useMemo(
    () =>
      filterWaitingRoomEntries(boardEntries, {
        doctorId,
        priority,
        search,
      }),
    [boardEntries, doctorId, priority, search],
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
  const persistedOrdering = waitingRoomStateQuery.data?.ordering ?? {
    mode: 'AUTO' as const,
    manualStatuses: [],
  };
  const isManualOrderingEnabled =
    manualOrderingRequested || persistedOrdering.mode === 'MANUAL';
  const isOrderingPending =
    isPersistingBoard || reorderMutation.isPending || statusMutation.isPending;
  const isDragEnabled =
    isManualOrderingEnabled && !hasActiveFilters && !isOrderingPending;
  const displayedManualStatuses = useMemo(
    () =>
      waitingRoomStatusFlow.filter((status) =>
        boardEntries.some(
          (entry) => entry.status === status && entry.manualOrder !== null,
        ),
      ),
    [boardEntries],
  );

  const clearFilters = () => {
    setSearch('');
    setPriority('ALL');
    setDoctorId('ALL');
  };

  const persistBoardMove = async (
    move: WaitingRoomBoardMove,
    correctionReason?: string,
  ): Promise<void> => {
    if (!clinicId) return;

    setIsPersistingBoard(true);
    setOptimisticEntries(move.entries);

    try {
      if (move.sourceStatus === move.destinationStatus) {
        await reorderMutation.reorderWaitingRoomEntries({
          clinicId,
          mode: 'MANUAL',
          orderedEntryIds: move.destinationOrderedEntryIds,
          status: move.destinationStatus,
        });
      } else {
        await statusMutation.updateWaitingRoomStatus({
          chairId:
            move.destinationStatus === 'IN_CHAIR'
              ? move.entry.chairId
              : undefined,
          clinicId,
          correctionReason,
          entryId: move.entry.id,
          status: move.destinationStatus,
          targetOrderedEntryIds: move.destinationOrderedEntryIds,
        });
      }

      await waitingRoomStateQuery.refetch();
    } finally {
      setOptimisticEntries(null);
      setIsPersistingBoard(false);
    }
  };

  const handleBoardMove = async (
    input: WaitingRoomBoardMoveInput,
  ): Promise<void> => {
    const move = projectWaitingRoomBoardMove(boardEntries, input);
    if (!move) return;

    if (
      move.sourceStatus !== 'IN_CHAIR' &&
      move.destinationStatus === 'IN_CHAIR' &&
      !move.entry.chairId
    ) {
      showNotification({
        message: `Assign an available chair to ${move.entry.patientName} before seating the patient.`,
        title: 'Chair required',
        variant: 'warning',
      });
      return;
    }

    if (
      requiresQueueStatusCorrectionReason(
        move.sourceStatus,
        move.destinationStatus,
      )
    ) {
      setCorrectionError(null);
      setPendingCorrectionMove(move);
      return;
    }

    try {
      await persistBoardMove(move);
      showNotification({
        message:
          move.sourceStatus === move.destinationStatus
            ? `${queueStatusLabels[move.destinationStatus]} order is shared with the clinic.`
            : `${move.entry.patientName} moved to ${queueStatusLabels[move.destinationStatus]}.`,
        title:
          move.sourceStatus === move.destinationStatus
            ? 'Queue order saved'
            : 'Patient status updated',
        variant: 'success',
      });
    } catch (error) {
      showNotification({
        message: getMoveErrorMessage(error),
        title: 'Queue movement failed',
        variant: 'danger',
      });
    }
  };

  const handleCorrectionSubmit = async (reason: string): Promise<void> => {
    if (!pendingCorrectionMove) return;

    setCorrectionError(null);

    try {
      await persistBoardMove(pendingCorrectionMove, reason);
      showNotification({
        message: `${pendingCorrectionMove.entry.patientName} moved back to ${queueStatusLabels[pendingCorrectionMove.destinationStatus]}.`,
        title: 'Queue status corrected',
        variant: 'success',
      });
      setPendingCorrectionMove(null);
    } catch (error) {
      setCorrectionError(getMoveErrorMessage(error));
    }
  };

  const handleAutoReorder = async (): Promise<void> => {
    if (!clinicId) return;

    setIsPersistingBoard(true);

    try {
      await reorderMutation.reorderWaitingRoomEntries({
        clinicId,
        mode: 'AUTO',
      });
      await waitingRoomStateQuery.refetch();
      setManualOrderingRequested(false);
      showNotification({
        message: 'Patients are ordered by priority and check-in time.',
        title: 'Automatic ordering restored',
        variant: 'success',
      });
    } catch (error) {
      showNotification({
        message: getMoveErrorMessage(error),
        title: 'Automatic reorder failed',
        variant: 'danger',
      });
    } finally {
      setIsPersistingBoard(false);
    }
  };

  const handleManualOrder = () => {
    setManualOrderingRequested(true);
    showNotification({
      message: 'Drag patient-card handles to save a shared manual order.',
      title: 'Manual ordering enabled',
      variant: 'info',
    });
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
                isManualOrderingEnabled={isManualOrderingEnabled}
                isOrderingPending={isOrderingPending}
                isRefreshing={isBackgroundFetching}
                manualStatuses={displayedManualStatuses}
                onAutoReorder={() => {
                  void handleAutoReorder();
                }}
                onClearFilters={clearFilters}
                onDoctorIdChange={setDoctorId}
                onManualOrder={handleManualOrder}
                onPriorityChange={setPriority}
                onRefresh={() => {
                  void waitingRoomStateQuery.refetch();
                }}
                onSearchChange={setSearch}
                priority={priority}
                search={search}
              />

              {boardEntries.length === 0 ? (
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
                  isDragEnabled={isDragEnabled}
                  manualStatuses={displayedManualStatuses}
                  onMove={handleBoardMove}
                />
              )}
            </Card>
          </div>

          {pendingCorrectionMove && (
            <WaitingRoomCorrectionModal
              destinationStatus={pendingCorrectionMove.destinationStatus}
              entry={pendingCorrectionMove.entry}
              error={correctionError}
              isSubmitting={isPersistingBoard}
              onHide={() => {
                setCorrectionError(null);
                setPendingCorrectionMove(null);
              }}
              onSubmit={handleCorrectionSubmit}
              show
            />
          )}
        </>
      ) : null}
    </>
  );
};

export default WaitingRoomPage;
