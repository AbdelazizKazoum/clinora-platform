import Icon from '@/components/wrappers/Icon';
import {
  Badge,
  Button,
  ButtonGroup,
  CardHeader,
  FormSelect,
  Spinner,
} from 'react-bootstrap';

import type { WaitingRoomConnectionStatus } from '../hooks';
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
  canManageQueue: boolean;
  connectionStatus: WaitingRoomConnectionStatus;
  doctorId: string | 'ALL';
  doctors: WaitingRoomDoctorOption[];
  hasActiveFilters: boolean;
  isManualOrderingEnabled: boolean;
  isInteractionDisabled: boolean;
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
  canManageQueue: boolean,
  connectionStatus: WaitingRoomConnectionStatus,
  isOrderingPending: boolean,
  isManualOrderingEnabled: boolean,
  hasActiveFilters: boolean,
): string => {
  if (connectionStatus === 'offline') {
    return 'Queue changes are paused while this device is offline.';
  }
  if (!canManageQueue)
    return 'Queue ordering is managed by clinical support staff.';
  if (isOrderingPending) return 'Saving the shared queue order...';
  if (isManualOrderingEnabled && hasActiveFilters) {
    return 'Clear filters to drag patients without hiding queue positions.';
  }
  if (isManualOrderingEnabled) {
    return 'Manual order is active. Use each card handle to move patients.';
  }

  return 'Automatically ordered by priority and check-in time.';
};

const connectionMetadata = {
  connected: { icon: 'circle', label: 'Live', variant: 'success' },
  connecting: { icon: 'loader-circle', label: 'Connecting', variant: 'info' },
  disconnected: {
    icon: 'radio-tower',
    label: 'Disconnected',
    variant: 'warning',
  },
  offline: { icon: 'wifi-off', label: 'Offline', variant: 'danger' },
} satisfies Record<
  WaitingRoomConnectionStatus,
  { icon: string; label: string; variant: string }
>;

const WaitingRoomToolbar = ({
  canManageChairs,
  canManageQueue,
  connectionStatus,
  doctorId,
  doctors,
  hasActiveFilters,
  isInteractionDisabled,
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
}: WaitingRoomToolbarProps) => {
  const connection = connectionMetadata[connectionStatus];

  return (
    <CardHeader className="border-light">
      <form
        className="d-flex flex-column gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <div
          className={`d-flex flex-wrap align-items-center gap-2 ${styles.toolbarTopRow}`}
        >
          <div className={`me-auto ${styles.toolbarHeading}`}>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0">Live patient flow</h5>
              <Badge
                bg={`${connection.variant}-subtle`}
                className={`text-${connection.variant} d-inline-flex align-items-center gap-1`}
              >
                <Icon
                  icon={connection.icon}
                  className={
                    connectionStatus === 'connected'
                      ? `fs-xs fill-success ${styles.liveDot}`
                      : connectionStatus === 'connecting'
                        ? styles.connectingIcon
                        : undefined
                  }
                />
                {connection.label}
              </Badge>
            </div>
            <p className="text-muted fs-xs mb-0 mt-1">
              {getOrderingDescription(
                canManageQueue,
                connectionStatus,
                isOrderingPending,
                isManualOrderingEnabled,
                hasActiveFilters,
              )}
            </p>
          </div>

          {canManageQueue && (
            <ButtonGroup aria-label="Queue ordering mode">
              <Button
                aria-pressed={!isManualOrderingEnabled}
                disabled={isInteractionDisabled || !isManualOrderingEnabled}
                onClick={onAutoReorder}
                title="Restore priority and check-in time ordering"
                type="button"
                variant={
                  !isManualOrderingEnabled ? 'primary' : 'outline-primary'
                }
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
                disabled={isInteractionDisabled || isManualOrderingEnabled}
                onClick={onManualOrder}
                title="Enable persisted drag-and-drop queue ordering"
                type="button"
                variant={
                  isManualOrderingEnabled ? 'primary' : 'outline-primary'
                }
              >
                <Icon icon="grip-vertical" className="me-1" />
                Manual Order
                {manualStatuses.length > 0 && (
                  <span className="ms-1">({manualStatuses.length})</span>
                )}
              </Button>
            </ButtonGroup>
          )}

          <Button
            aria-label="Refresh waiting room"
            className={styles.toolbarActionButton}
            disabled={isRefreshing || connectionStatus === 'offline'}
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
              className={styles.toolbarActionButton}
              disabled={connectionStatus === 'offline'}
              onClick={onManageChairs}
              type="button"
              variant="outline-secondary"
            >
              <Icon icon="armchair" className="me-1" />
              Manage Chairs
            </Button>
          )}
        </div>

        <div
          className={`d-flex flex-wrap align-items-center gap-2 ${styles.toolbarFilters}`}
        >
          <div className={`app-search flex-grow-1 ${styles.toolbarSearch}`}>
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

          <div className={`app-search ${styles.toolbarFilter}`}>
            <FormSelect
              aria-label="Filter waiting room by priority"
              className="form-control"
              onChange={(event) =>
                onPriorityChange(
                  event.target.value as WaitingRoomPriorityFilter,
                )
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

          <div className={`app-search ${styles.toolbarFilter}`}>
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
};

export default WaitingRoomToolbar;
