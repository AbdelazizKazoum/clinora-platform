import Icon from '@/components/wrappers/Icon';
import { SimpleBar } from '@/components/wrappers/SimpleBar';
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap';

import {
  groupWaitingRoomEntriesByStatus,
  queueStatusLabels,
  waitingRoomStatusFlow,
  type QueueStatus,
  type WaitingRoomEntry,
} from '../model';
import styles from './waiting-room-board.module.scss';
import WaitingRoomEntryCard from './waiting-room-entry-card';

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
  entries: WaitingRoomEntry[];
  manualStatuses: QueueStatus[];
}

const WaitingRoomBoard = ({
  entries,
  manualStatuses,
}: WaitingRoomBoardProps) => {
  const groupedEntries = groupWaitingRoomEntriesByStatus(entries);

  return (
    <CardBody className="p-0">
      <div className="kanban-content" aria-label="Waiting room board">
        {boardColumnConfigs.map((column) => {
          const columnEntries = groupedEntries[column.status];
          const isManuallyOrdered = manualStatuses.includes(column.status);

          return (
            <section
              aria-labelledby={`waiting-room-column-${column.status}`}
              className={`kanban-board bg-${column.variant} bg-opacity-10 ${styles.boardColumn}`}
              key={column.status}
            >
              <div className="kanban-item py-2 px-3 d-flex align-items-center gap-2">
                <span
                  className={`avatar-xs avatar-title rounded-circle bg-${column.variant}-subtle text-${column.variant}`}
                >
                  <Icon icon={column.icon} />
                </span>
                <h5 className="m-0" id={`waiting-room-column-${column.status}`}>
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
                  className="mb-0"
                  aria-label={`${queueStatusLabels[column.status]} patients`}
                >
                  {columnEntries.map((entry) => (
                    <li className="kanban-item" key={entry.id}>
                      <WaitingRoomEntryCard entry={entry} />
                    </li>
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
                </ul>
              </SimpleBar>
            </section>
          );
        })}
      </div>
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
