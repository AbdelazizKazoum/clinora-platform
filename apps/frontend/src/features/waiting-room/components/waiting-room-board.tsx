import Icon from '@/components/wrappers/Icon';
import { SimpleBar } from '@/components/wrappers/SimpleBar';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import clsx from 'clsx';
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap';

import {
  QUEUE_STATUSES,
  groupWaitingRoomEntriesByStatus,
  queueStatusLabels,
  waitingRoomStatusFlow,
  type QueueStatus,
  type WaitingRoomBoardMoveInput,
  type WaitingRoomEntry,
} from '../model';
import styles from './waiting-room-board.module.scss';
import WaitingRoomEntryCard from './waiting-room-entry-card';
import WaitingRoomIconAvatar from './waiting-room-icon-avatar';

interface BoardColumnConfig {
  icon: string;
  status: QueueStatus;
  variant: string;
}

const boardColumnConfigs: BoardColumnConfig[] = [
  { icon: 'log-in', status: 'ARRIVED', variant: 'info' },
  { icon: 'clock-3', status: 'WAITING', variant: 'warning' },
  { icon: 'armchair', status: 'IN_CHAIR', variant: 'primary' },
  { icon: 'circle-check-big', status: 'DONE', variant: 'success' },
];

interface WaitingRoomBoardProps {
  canManageQueue: boolean;
  canReorderEntries: boolean;
  entries: WaitingRoomEntry[];
  isDragEnabled: boolean;
  isInteractionDisabled: boolean;
  manualStatuses: QueueStatus[];
  onAssignChair?: (entry: WaitingRoomEntry) => void;
  onEditNotes: (entry: WaitingRoomEntry) => void;
  onMoveStatus: (entry: WaitingRoomEntry, status: QueueStatus) => void;
  onMove: (move: WaitingRoomBoardMoveInput) => Promise<void> | void;
  onReorder: (entry: WaitingRoomEntry, direction: 'down' | 'up') => void;
  onSelectEntry: (entry: WaitingRoomEntry) => void;
  onStartTreatment: (entry: WaitingRoomEntry) => void;
  recentlyUpdatedEntryIds: readonly string[];
}

const isQueueStatus = (value: string): value is QueueStatus =>
  QUEUE_STATUSES.includes(value as QueueStatus);

const WaitingRoomBoard = ({
  canManageQueue,
  canReorderEntries,
  entries,
  isDragEnabled,
  isInteractionDisabled,
  manualStatuses,
  onAssignChair,
  onEditNotes,
  onMoveStatus,
  onMove,
  onReorder,
  onSelectEntry,
  onStartTreatment,
  recentlyUpdatedEntryIds,
}: WaitingRoomBoardProps) => {
  const groupedEntries = groupWaitingRoomEntriesByStatus(entries);
  const recentlyUpdatedEntryIdSet = new Set(recentlyUpdatedEntryIds);

  const handleDragEnd = (result: DropResult) => {
    if (
      !result.destination ||
      !isQueueStatus(result.source.droppableId) ||
      !isQueueStatus(result.destination.droppableId)
    ) {
      return;
    }

    void onMove({
      destinationIndex: result.destination.index,
      destinationStatus: result.destination.droppableId,
      entryId: result.draggableId,
      sourceIndex: result.source.index,
      sourceStatus: result.source.droppableId,
    });
  };

  return (
    <CardBody className="p-0">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-content" aria-label="Waiting room board">
          {boardColumnConfigs.map((column) => {
            const columnEntries = groupedEntries[column.status];
            const isManuallyOrdered = manualStatuses.includes(column.status);

            return (
              <Droppable
                droppableId={column.status}
                isDropDisabled={!isDragEnabled}
                key={column.status}
              >
                {(provided, snapshot) => (
                  <section
                    aria-labelledby={`waiting-room-column-${column.status}`}
                    className={clsx(
                      `kanban-board bg-${column.variant} bg-opacity-10`,
                      styles.boardColumn,
                      snapshot.isDraggingOver && styles.columnDragOver,
                    )}
                  >
                    <div className="kanban-item py-2 px-3 d-flex align-items-center gap-2">
                      <WaitingRoomIconAvatar
                        icon={column.icon}
                        shape="circle"
                        size="xs"
                        variant={column.variant}
                      />
                      <h5
                        className="m-0"
                        id={`waiting-room-column-${column.status}`}
                      >
                        {queueStatusLabels[column.status]}
                      </h5>
                      <span
                        className={`badge badge-soft-${column.variant} text-${column.variant}`}
                      >
                        {columnEntries.length}
                      </span>
                      {isManuallyOrdered && (
                        <span className="badge badge-soft-secondary text-secondary ms-auto">
                          Manual
                        </span>
                      )}
                    </div>

                    <SimpleBar
                      className={`kanban-board-group px-2 pb-2 ${styles.columnScroll}`}
                    >
                      <ul
                        {...provided.droppableProps}
                        aria-label={`${queueStatusLabels[column.status]} patients`}
                        className="mb-0"
                        ref={provided.innerRef}
                      >
                        {columnEntries.map((entry, index) => (
                          <Draggable
                            draggableId={entry.id}
                            index={index}
                            isDragDisabled={!isDragEnabled}
                            key={entry.id}
                          >
                            {(draggableProvided, draggableSnapshot) => (
                              <li
                                {...draggableProvided.draggableProps}
                                className={clsx(
                                  'kanban-item',
                                  draggableSnapshot.isDragging &&
                                    'sortable-fallback',
                                )}
                                ref={draggableProvided.innerRef}
                              >
                                <WaitingRoomEntryCard
                                  canMoveDown={index < columnEntries.length - 1}
                                  canMoveUp={index > 0}
                                  canManageQueue={canManageQueue}
                                  canReorderEntries={canReorderEntries}
                                  dragHandleProps={
                                    draggableProvided.dragHandleProps ??
                                    undefined
                                  }
                                  entry={entry}
                                  isDragging={draggableSnapshot.isDragging}
                                  isInteractionDisabled={isInteractionDisabled}
                                  isRecentlyUpdated={recentlyUpdatedEntryIdSet.has(
                                    entry.id,
                                  )}
                                  onAssignChair={onAssignChair}
                                  onEditNotes={onEditNotes}
                                  onMoveStatus={onMoveStatus}
                                  onReorder={onReorder}
                                  onSelect={onSelectEntry}
                                  onStartTreatment={onStartTreatment}
                                />
                              </li>
                            )}
                          </Draggable>
                        ))}

                        {columnEntries.length === 0 && (
                          <li
                            className={`rounded text-center text-muted px-3 py-5 ${styles.emptyColumn}`}
                          >
                            <Icon icon="inbox" className="fs-24 mb-2" />
                            <p className="fs-sm mb-0">
                              No patients{' '}
                              {queueStatusLabels[column.status].toLowerCase()}.
                            </p>
                          </li>
                        )}
                        {provided.placeholder}
                      </ul>
                    </SimpleBar>
                  </section>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </CardBody>
  );
};

interface WaitingRoomBoardEmptyStateProps {
  filtered: boolean;
  onClearFilters: () => void;
}

export const WaitingRoomBoardEmptyState = ({
  filtered,
  onClearFilters,
}: WaitingRoomBoardEmptyStateProps) => (
  <CardBody className="text-center py-5">
    <Icon
      icon={filtered ? 'search-x' : 'clipboard-check'}
      className="display-5 text-muted mb-3"
    />
    <h5>
      {filtered ? 'No patients match these filters' : 'The queue is clear'}
    </h5>
    <p className="text-muted mb-0">
      {filtered
        ? 'Try another patient, priority, or doctor filter.'
        : 'Checked-in patients will appear here automatically.'}
    </p>
    {filtered && (
      <Button
        className="mt-3"
        onClick={onClearFilters}
        type="button"
        variant="secondary"
      >
        <Icon icon="x" className="me-1" />
        Clear filters
      </Button>
    )}
  </CardBody>
);

export const WaitingRoomBoardSkeleton = () => (
  <>
    <Card className="mb-0" aria-label="Loading waiting room board">
      <CardHeader className="placeholder-glow">
        <Row className="g-2 align-items-center">
          <Col xs={12} lg={5}>
            <span className="placeholder col-8 d-block mb-2" />
            <span className="placeholder col-6 d-block" />
          </Col>
          <Col xs={12} lg={7} className="text-lg-end">
            <span className="placeholder col-7 d-inline-block" />
          </Col>
        </Row>
      </CardHeader>
      <CardBody className="p-0 overflow-hidden">
        <div className="kanban-content">
          {waitingRoomStatusFlow.map((status) => (
            <div
              aria-hidden="true"
              className={`kanban-board p-2 placeholder-glow ${styles.boardColumn}`}
              key={status}
            >
              <div className="d-flex align-items-center justify-content-between px-1 py-2">
                <span className="placeholder col-5" />
                <span
                  className="placeholder rounded-circle"
                  style={{ height: 24, width: 24 }}
                />
              </div>
              {Array.from({ length: 3 }, (_, index) => (
                <Card className="border-0 shadow-sm mb-2" key={index}>
                  <CardBody>
                    <span className="placeholder col-8 d-block mb-3" />
                    <span className="placeholder col-6 d-block mb-2" />
                    <span className="placeholder col-9 d-block mb-3" />
                    <span className="placeholder col-5 d-block" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  </>
);

export default WaitingRoomBoard;
