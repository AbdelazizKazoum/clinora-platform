'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

import WaitingRoomBoard, {
  WaitingRoomBoardEmptyState,
  WaitingRoomBoardSkeleton,
} from '../components/waiting-room-board';
import WaitingRoomChairAssignmentModal from '../components/waiting-room-chair-assignment-modal';
import WaitingRoomChairManagementModal, {
  type WaitingRoomChairFormValues,
} from '../components/waiting-room-chair-management-modal';
import WaitingRoomConnectionAlert from '../components/waiting-room-connection-alert';
import WaitingRoomCorrectionModal from '../components/waiting-room-correction-modal';
import WaitingRoomNotesModal from '../components/waiting-room-notes-modal';
import WaitingRoomPatientDetailsPanel from '../components/waiting-room-patient-details-panel';
import WaitingRoomSummaryCards, {
  WaitingRoomSummarySkeleton,
} from '../components/waiting-room-summary-cards';
import WaitingRoomToolbar from '../components/waiting-room-toolbar';
import {
  useAssignWaitingRoomChair,
  useCreateWaitingRoomChair,
  useReorderWaitingRoomEntries,
  useUpdateWaitingRoomChair,
  useUpdateWaitingRoomNotes,
  useUpdateWaitingRoomStatus,
  useWaitingRoomEvents,
  useWaitingRoomState,
} from '../hooks';
import {
  buildWaitingRoomTreatmentPath,
  filterWaitingRoomEntries,
  groupWaitingRoomEntriesByStatus,
  getWaitingRoomDoctorOptions,
  getWaitingRoomSummary,
  projectWaitingRoomBoardMove,
  queueStatusLabels,
  requiresQueueStatusCorrectionReason,
  waitingRoomStatusFlow,
  type WaitingRoomBoardMove,
  type WaitingRoomBoardMoveInput,
  type WaitingRoomChair,
  type WaitingRoomEntry,
  type QueueStatus,
  type WaitingRoomPriorityFilter,
} from '../model';

const getMoveErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Unable to save the waiting-room movement.';

const getChairErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Unable to save the chair change. Refresh availability and try again.';

const getNotesErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Unable to save the queue notes. Try again.';

type PendingChairSelection =
  | { entry: WaitingRoomEntry; kind: 'assign' }
  | { entry: WaitingRoomEntry; kind: 'seat'; move: WaitingRoomBoardMove };

const WaitingRoomPage = () => {
  const router = useRouter();
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
  const [pendingCorrectionChairId, setPendingCorrectionChairId] = useState<
    string | null
  >(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [pendingChairSelection, setPendingChairSelection] =
    useState<PendingChairSelection | null>(null);
  const [chairError, setChairError] = useState<string | null>(null);
  const [isChairManagementOpen, setIsChairManagementOpen] = useState(false);
  const [chairManagementError, setChairManagementError] = useState<
    string | null
  >(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [notesEntryId, setNotesEntryId] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const reorderMutation = useReorderWaitingRoomEntries();
  const statusMutation = useUpdateWaitingRoomStatus();
  const assignChairMutation = useAssignWaitingRoomChair();
  const createChairMutation = useCreateWaitingRoomChair();
  const updateChairMutation = useUpdateWaitingRoomChair();
  const updateNotesMutation = useUpdateWaitingRoomNotes();
  const waitingRoomStateQuery = useWaitingRoomState(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  const liveState = useWaitingRoomEvents(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );

  const entries = waitingRoomStateQuery.data?.entries ?? [];
  const chairs = waitingRoomStateQuery.data?.chairs ?? [];
  const boardEntries = optimisticEntries ?? entries;
  const canManageChairs =
    session?.user.role === 'admin' || session?.user.role === 'secretary';
  const canManageQueue =
    session?.user.role === 'admin' ||
    session?.user.role === 'secretary' ||
    session?.user.role === 'dental_assistant';
  const selectedEntry =
    boardEntries.find((entry) => entry.id === selectedEntryId) ?? null;
  const notesEntry =
    boardEntries.find((entry) => entry.id === notesEntryId) ?? null;
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
  const isPermissionError =
    waitingRoomStateQuery.error instanceof ApiError &&
    (waitingRoomStateQuery.error.status === 401 ||
      waitingRoomStateQuery.error.status === 403);
  const hasBlockingError = hasInitialError || isPermissionError;
  const persistedOrdering = waitingRoomStateQuery.data?.ordering ?? {
    mode: 'AUTO' as const,
    manualStatuses: [],
  };
  const isManualOrderingEnabled =
    manualOrderingRequested || persistedOrdering.mode === 'MANUAL';
  const isOrderingPending =
    isPersistingBoard || reorderMutation.isPending || statusMutation.isPending;
  const isInteractionDisabled = isOrderingPending || !liveState.isOnline;
  const canReorderEntries =
    canManageQueue && isManualOrderingEnabled && !hasActiveFilters;
  const isDragEnabled =
    canManageQueue &&
    isManualOrderingEnabled &&
    !hasActiveFilters &&
    !isInteractionDisabled;
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
    selectedChairId?: string,
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
              ? (selectedChairId ?? move.entry.chairId)
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
    if (!canManageQueue || !liveState.isOnline) return;

    const move = projectWaitingRoomBoardMove(boardEntries, input);
    if (!move) return;

    if (
      move.sourceStatus !== 'IN_CHAIR' &&
      move.destinationStatus === 'IN_CHAIR'
    ) {
      setChairError(null);
      setPendingChairSelection({
        entry: move.entry,
        kind: 'seat',
        move,
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
      setPendingCorrectionChairId(null);
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

    if (!liveState.isOnline) {
      setCorrectionError('Reconnect before correcting the queue status.');
      return;
    }

    setCorrectionError(null);

    try {
      await persistBoardMove(
        pendingCorrectionMove,
        reason,
        pendingCorrectionChairId ?? undefined,
      );
      showNotification({
        message: `${pendingCorrectionMove.entry.patientName} moved back to ${queueStatusLabels[pendingCorrectionMove.destinationStatus]}.`,
        title: 'Queue status corrected',
        variant: 'success',
      });
      setPendingCorrectionMove(null);
      setPendingCorrectionChairId(null);
    } catch (error) {
      setCorrectionError(getMoveErrorMessage(error));
    }
  };

  const handleChairSubmit = async (chairId: string): Promise<void> => {
    if (!clinicId || !pendingChairSelection) return;

    if (!liveState.isOnline) {
      setChairError('Reconnect before changing the chair assignment.');
      return;
    }

    setChairError(null);

    if (pendingChairSelection.kind === 'seat') {
      const { move } = pendingChairSelection;
      if (
        requiresQueueStatusCorrectionReason(
          move.sourceStatus,
          move.destinationStatus,
        )
      ) {
        setPendingChairSelection(null);
        setPendingCorrectionChairId(chairId);
        setCorrectionError(null);
        setPendingCorrectionMove(move);
        return;
      }

      try {
        await persistBoardMove(move, undefined, chairId);
        showNotification({
          message: `${move.entry.patientName} is seated in ${chairs.find((chair) => chair.id === chairId)?.name ?? 'the selected chair'}.`,
          title: 'Patient seated',
          variant: 'success',
        });
        setPendingChairSelection(null);
      } catch (error) {
        setChairError(getChairErrorMessage(error));
        void waitingRoomStateQuery.refetch();
      }
      return;
    }

    try {
      await assignChairMutation.assignWaitingRoomChair({
        chairId,
        clinicId,
        entryId: pendingChairSelection.entry.id,
      });
      await waitingRoomStateQuery.refetch();
      showNotification({
        message: `${pendingChairSelection.entry.patientName}'s chair assignment was updated.`,
        title: 'Chair updated',
        variant: 'success',
      });
      setPendingChairSelection(null);
    } catch (error) {
      setChairError(getChairErrorMessage(error));
      void waitingRoomStateQuery.refetch();
    }
  };

  const handleCreateChair = async (
    values: WaitingRoomChairFormValues,
  ): Promise<void> => {
    if (!clinicId) return;

    if (!liveState.isOnline) {
      setChairManagementError('Reconnect before creating a chair.');
      return;
    }

    setChairManagementError(null);
    try {
      const chair = await createChairMutation.createWaitingRoomChair({
        clinicId,
        code: values.code || null,
        isActive: true,
        name: values.name,
      });
      showNotification({
        message: `${chair.name} is ready for patient assignment.`,
        title: 'Chair created',
        variant: 'success',
      });
    } catch (error) {
      setChairManagementError(getChairErrorMessage(error));
      throw error;
    }
  };

  const handleUpdateChair = async (
    chair: WaitingRoomChair,
    values: WaitingRoomChairFormValues,
  ): Promise<void> => {
    if (!clinicId) return;

    if (!liveState.isOnline) {
      setChairManagementError('Reconnect before updating a chair.');
      return;
    }

    setChairManagementError(null);
    try {
      const updatedChair = await updateChairMutation.updateWaitingRoomChair({
        chairId: chair.id,
        clinicId,
        code: values.code || null,
        isActive: values.isActive,
        name: values.name,
      });
      showNotification({
        message: `${updatedChair.name} was ${updatedChair.isActive ? 'updated' : 'deactivated'}.`,
        title: 'Chair saved',
        variant: 'success',
      });
    } catch (error) {
      setChairManagementError(getChairErrorMessage(error));
      throw error;
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

  const handleStatusMoveRequest = (
    entry: WaitingRoomEntry,
    destinationStatus: QueueStatus,
  ): void => {
    const sourceEntries = boardEntries.filter(
      (candidate) => candidate.status === entry.status,
    );
    const destinationEntries = boardEntries.filter(
      (candidate) => candidate.status === destinationStatus,
    );

    void handleBoardMove({
      destinationIndex: destinationEntries.length,
      destinationStatus,
      entryId: entry.id,
      sourceIndex: sourceEntries.findIndex(
        (candidate) => candidate.id === entry.id,
      ),
      sourceStatus: entry.status,
    });
  };

  const handleAccessibleReorder = (
    entry: WaitingRoomEntry,
    direction: 'down' | 'up',
  ): void => {
    const statusEntries =
      groupWaitingRoomEntriesByStatus(boardEntries)[entry.status];
    const sourceIndex = statusEntries.findIndex(
      (candidate) => candidate.id === entry.id,
    );
    if (sourceIndex === -1) return;

    const destinationIndex =
      direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    if (destinationIndex < 0 || destinationIndex >= statusEntries.length) {
      return;
    }

    void handleBoardMove({
      destinationIndex,
      destinationStatus: entry.status,
      entryId: entry.id,
      sourceIndex,
      sourceStatus: entry.status,
    });
  };

  const handleNotesSubmit = async (
    queueNotes: string | null,
  ): Promise<void> => {
    if (!clinicId || !notesEntry) return;

    if (!liveState.isOnline) {
      setNotesError('Reconnect before saving queue notes.');
      return;
    }

    setNotesError(null);
    try {
      await updateNotesMutation.updateWaitingRoomNotes({
        clinicId,
        entryId: notesEntry.id,
        queueNotes,
      });
      showNotification({
        message: queueNotes
          ? `${notesEntry.patientName}'s queue notes were updated.`
          : `${notesEntry.patientName}'s queue notes were cleared.`,
        title: 'Queue notes saved',
        variant: 'success',
      });
      setNotesEntryId(null);
    } catch (error) {
      setNotesError(getNotesErrorMessage(error));
    }
  };

  const handleStartTreatment = (entry: WaitingRoomEntry): void => {
    const path = buildWaitingRoomTreatmentPath(entry);

    if (!path) {
      showNotification({
        message:
          'Treatment can only start after the patient has an assigned chair.',
        title: 'Treatment unavailable',
        variant: 'warning',
      });
      return;
    }

    router.push(path);
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

      {clinicId && sessionStatus === 'authenticated' && !isInitialLoading && (
        <WaitingRoomConnectionAlert
          connectionStatus={liveState.connectionStatus}
          isRetrying={waitingRoomStateQuery.isFetching}
          onRetry={() => {
            liveState.reconnect();
            void waitingRoomStateQuery.refetch();
          }}
        />
      )}

      {waitingRoomStateQuery.isError && isPermissionError && (
        <Alert className="d-flex align-items-start gap-3" variant="warning">
          <span className="avatar-sm avatar-title rounded-circle bg-warning-subtle text-warning flex-shrink-0">
            <Icon icon="shield-alert" />
          </span>
          <div>
            <p className="fw-semibold mb-1">Waiting room access denied</p>
            <p className="mb-0 fs-sm">
              Your current clinic role does not allow access to this waiting
              room. Contact a clinic administrator if this is unexpected.
            </p>
          </div>
        </Alert>
      )}

      {waitingRoomStateQuery.isError && !isPermissionError && (
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
      ) : clinicId && !hasBlockingError ? (
        <>
          {!canManageQueue && (
            <Alert
              className="d-flex align-items-center gap-2 py-2"
              variant="info"
            >
              <Icon icon="eye" className="flex-shrink-0" />
              <span className="fs-sm">
                You have view-only access to the waiting room.
              </span>
            </Alert>
          )}

          <WaitingRoomSummaryCards summary={summary} />

          <div className="outlook-box kanban-app mb-3">
            <Card className="h-100 mb-0 flex-grow-1 overflow-hidden">
              <WaitingRoomToolbar
                canManageChairs={canManageChairs}
                canManageQueue={canManageQueue}
                connectionStatus={liveState.connectionStatus}
                doctorId={doctorId}
                doctors={doctors}
                hasActiveFilters={hasActiveFilters}
                isManualOrderingEnabled={isManualOrderingEnabled}
                isInteractionDisabled={isInteractionDisabled}
                isOrderingPending={isOrderingPending}
                isRefreshing={isBackgroundFetching}
                manualStatuses={displayedManualStatuses}
                onAutoReorder={() => {
                  void handleAutoReorder();
                }}
                onClearFilters={clearFilters}
                onDoctorIdChange={setDoctorId}
                onManualOrder={handleManualOrder}
                onManageChairs={() => {
                  setChairManagementError(null);
                  setIsChairManagementOpen(true);
                }}
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
                  canManageQueue={canManageQueue}
                  canReorderEntries={canReorderEntries}
                  entries={filteredEntries}
                  isDragEnabled={isDragEnabled}
                  isInteractionDisabled={isInteractionDisabled}
                  manualStatuses={displayedManualStatuses}
                  onAssignChair={
                    canManageQueue
                      ? (entry) => {
                          setChairError(null);
                          setPendingChairSelection({ entry, kind: 'assign' });
                        }
                      : undefined
                  }
                  onEditNotes={(entry) => {
                    setNotesError(null);
                    setNotesEntryId(entry.id);
                  }}
                  onMove={handleBoardMove}
                  onMoveStatus={handleStatusMoveRequest}
                  onReorder={handleAccessibleReorder}
                  onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
                  onStartTreatment={handleStartTreatment}
                  recentlyUpdatedEntryIds={liveState.recentlyUpdatedEntryIds}
                />
              )}
            </Card>
          </div>

          {pendingChairSelection && (
            <WaitingRoomChairAssignmentModal
              chairs={chairs}
              entries={boardEntries}
              entry={pendingChairSelection.entry}
              error={chairError}
              isSubmitting={isPersistingBoard || assignChairMutation.isPending}
              onHide={() => {
                setChairError(null);
                setPendingChairSelection(null);
              }}
              onManageChairs={
                canManageChairs
                  ? () => {
                      setChairManagementError(null);
                      setIsChairManagementOpen(true);
                    }
                  : undefined
              }
              onSubmit={handleChairSubmit}
              show={!isChairManagementOpen}
            />
          )}

          {isChairManagementOpen && (
            <WaitingRoomChairManagementModal
              chairs={chairs}
              error={chairManagementError}
              isSubmitting={
                createChairMutation.isPending || updateChairMutation.isPending
              }
              onCreate={handleCreateChair}
              onHide={() => {
                setChairManagementError(null);
                setIsChairManagementOpen(false);
              }}
              onUpdate={handleUpdateChair}
              show
            />
          )}

          {pendingCorrectionMove && (
            <WaitingRoomCorrectionModal
              destinationStatus={pendingCorrectionMove.destinationStatus}
              entry={pendingCorrectionMove.entry}
              error={correctionError}
              isSubmitting={isPersistingBoard}
              onHide={() => {
                setCorrectionError(null);
                setPendingCorrectionChairId(null);
                setPendingCorrectionMove(null);
              }}
              onSubmit={handleCorrectionSubmit}
              show
            />
          )}

          <WaitingRoomPatientDetailsPanel
            canEditNotes={canManageQueue}
            entry={selectedEntry}
            isInteractionDisabled={!liveState.isOnline}
            onEditNotes={(entry) => {
              setNotesError(null);
              setNotesEntryId(entry.id);
            }}
            onHide={() => setSelectedEntryId(null)}
            onStartTreatment={handleStartTreatment}
          />

          {notesEntry && canManageQueue && (
            <WaitingRoomNotesModal
              entry={notesEntry}
              error={notesError}
              isSubmitting={updateNotesMutation.isPending}
              onHide={() => {
                setNotesError(null);
                setNotesEntryId(null);
              }}
              onSubmit={handleNotesSubmit}
              show
            />
          )}
        </>
      ) : null}
    </>
  );
};

export default WaitingRoomPage;
