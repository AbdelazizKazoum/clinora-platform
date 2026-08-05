import Icon from '@/components/wrappers/Icon';
import { Alert, Button, Spinner } from 'react-bootstrap';

import type { WaitingRoomConnectionStatus } from '../hooks';

interface WaitingRoomConnectionAlertProps {
  connectionStatus: WaitingRoomConnectionStatus;
  isRetrying: boolean;
  onRetry: () => void;
}

const WaitingRoomConnectionAlert = ({
  connectionStatus,
  isRetrying,
  onRetry,
}: WaitingRoomConnectionAlertProps) => {
  if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
    return null;
  }

  const isOffline = connectionStatus === 'offline';

  return (
    <Alert
      className="d-flex flex-wrap align-items-center gap-3"
      variant={isOffline ? 'danger' : 'warning'}
    >
      <span
        className={`avatar-sm avatar-title rounded-circle flex-shrink-0 bg-${
          isOffline ? 'danger' : 'warning'
        }-subtle text-${isOffline ? 'danger' : 'warning'}`}
      >
        <Icon icon={isOffline ? 'wifi-off' : 'radio-tower'} />
      </span>
      <div className="flex-grow-1">
        <p className="fw-semibold mb-1">
          {isOffline ? 'You are offline' : 'Live updates are disconnected'}
        </p>
        <p className="mb-0 fs-sm">
          {isOffline
            ? 'Queue changes are paused until the network connection returns.'
            : 'The board may be stale. Reconnect to resume automatic queue updates.'}
        </p>
      </div>
      <Button
        disabled={isRetrying}
        onClick={onRetry}
        size="sm"
        variant={isOffline ? 'outline-danger' : 'outline-warning'}
      >
        {isRetrying ? (
          <Spinner animation="border" className="me-1" size="sm" />
        ) : (
          <Icon icon="refresh-cw" className="me-1" />
        )}
        Retry connection
      </Button>
    </Alert>
  );
};

export default WaitingRoomConnectionAlert;
