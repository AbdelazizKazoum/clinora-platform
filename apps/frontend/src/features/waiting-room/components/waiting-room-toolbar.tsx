import Icon from '@/components/wrappers/Icon';
import {
  Badge,
  Button,
  ButtonGroup,
  CardHeader,
  FormSelect,
  Spinner,
} from 'react-bootstrap';

import {
  QUEUE_PRIORITIES,
  queuePriorityLabels,
  type QueueStatus,
  type WaitingRoomDoctorOption,
  type WaitingRoomPriorityFilter,
} from '../model';
import styles from './waiting-room-board.module.scss';

interface WaitingRoomToolbarProps {
  canManageChairs: boolean;
  doctorId: string | 'ALL';
  doctors: WaitingRoomDoctorOption[];
  hasActiveFilters: boolean;
  isManualOrderingEnabled: boolean;
  isOrderingPending: boolean;
  isRefreshing: boolean;
  manualStatuses: QueueStatus[];
  onAutoReorder: () => void;
  onClearFilters: () => void;
  onDoctorIdChange: (doctorId: string | 'ALL') => void;
  onPriorityChange: (priority: WaitingRoomPriorityFilter) => void;
  onManualOrder: () => void;
  onManageChairs: () => void;
  onRefresh: () => void;
  onSearchChange: (search: string) => void;
  priority: WaitingRoomPriorityFilter;
  search: string;
}

const getOrderingDescription = (
  isOrderingPending: boolean,
  isManualOrderingEnabled: boolean,
  hasActiveFilters: boolean,
): string => {
  if (isOrderingPending) return 'Saving the shared queue order...';
  if (isManualOrderingEnabled && hasActiveFilters) {
    return 'Clear filters to drag patients without hiding queue positions.';
  }
  if (isManualOrderingEnabled) {
    return 'Manual order is active. Use each card handle to move patients.';
  }

  return 'Automatically ordered by priority and check-in time.';
};

const WaitingRoomToolbar = ({
  canManageChairs,
  doctorId,
  doctors,
  hasActiveFilters,
  isManualOrderingEnabled,
  isOrderingPending,
  isRefreshing,
  manualStatuses,
  onAutoReorder,
  onClearFilters,
  onDoctorIdChange,
  onManualOrder,
  onManageChairs,
  onPriorityChange,
  onRefresh,
  onSearchChange,
  priority,
  search,
}: WaitingRoomToolbarProps) => (
  <CardHeader className="border-light">
    <form
      className="d-flex flex-column gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Live patient flow</h5>
            <Badge
              bg="success-subtle"
              className="text-success d-inline-flex align-items-center gap-1"
            >
              <Icon
                icon="circle"
                className={`fs-xs fill-success ${styles.liveDot}`}
              />
              Realtime
            </Badge>
          </div>
          <p className="text-muted fs-xs mb-0 mt-1">
            {getOrderingDescription(
              isOrderingPending,
              isManualOrderingEnabled,
              hasActiveFilters,
            )}
          </p>
        </div>

        <ButtonGroup aria-label="Queue ordering mode">
          <Button
            aria-pressed={!isManualOrderingEnabled}
            disabled={isOrderingPending || !isManualOrderingEnabled}
            onClick={onAutoReorder}
            title="Restore priority and check-in time ordering"
            type="button"
            variant={!isManualOrderingEnabled ? 'primary' : 'outline-primary'}
          >
            {isOrderingPending && isManualOrderingEnabled ? (
              <Spinner animation="border" className="me-1" size="sm" />
            ) : (
              <Icon icon="list-restart" className="me-1" />
            )}
            Auto Reorder
          </Button>
          <Button
            aria-pressed={isManualOrderingEnabled}
            disabled={isOrderingPending || isManualOrderingEnabled}
            onClick={onManualOrder}
            title="Enable persisted drag-and-drop queue ordering"
            type="button"
            variant={isManualOrderingEnabled ? 'primary' : 'outline-primary'}
          >
            <Icon icon="grip-vertical" className="me-1" />
            Manual Order
            {manualStatuses.length > 0 && (
              <span className="ms-1">({manualStatuses.length})</span>
            )}
          </Button>
        </ButtonGroup>

        <Button
          aria-label="Refresh waiting room"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
          variant="outline-secondary"
        >
          {isRefreshing ? (
            <Spinner animation="border" className="me-1" size="sm" />
          ) : (
            <Icon icon="refresh-cw" className="me-1" />
          )}
          Refresh
        </Button>

        {canManageChairs && (
          <Button
            onClick={onManageChairs}
            type="button"
            variant="outline-secondary"
          >
            <Icon icon="armchair" className="me-1" />
            Manage Chairs
          </Button>
        )}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="app-search flex-grow-1" style={{ minWidth: 240 }}>
          <input
            aria-label="Search waiting room"
            className="form-control"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search patient, phone, doctor, notes..."
            type="search"
            value={search}
          />
          <Icon icon="search" className="app-search-icon text-muted" />
        </div>

        <div className="app-search flex-shrink-0">
          <FormSelect
            aria-label="Filter waiting room by priority"
            className="form-control"
            onChange={(event) =>
              onPriorityChange(event.target.value as WaitingRoomPriorityFilter)
            }
            value={priority}
          >
            <option value="ALL">All priorities</option>
            {QUEUE_PRIORITIES.map((queuePriority) => (
              <option key={queuePriority} value={queuePriority}>
                {queuePriorityLabels[queuePriority]}
              </option>
            ))}
          </FormSelect>
          <Icon icon="siren" className="app-search-icon text-muted" />
        </div>

        <div className="app-search flex-shrink-0">
          <FormSelect
            aria-label="Filter waiting room by doctor"
            className="form-control"
            onChange={(event) => onDoctorIdChange(event.target.value)}
            value={doctorId}
          >
            <option value="ALL">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </FormSelect>
          <Icon icon="stethoscope" className="app-search-icon text-muted" />
        </div>

        {hasActiveFilters && (
          <Button onClick={onClearFilters} type="button" variant="secondary">
            <Icon icon="x" className="me-1" />
            Clear
          </Button>
        )}
      </div>
    </form>
  </CardHeader>
);

export default WaitingRoomToolbar;
