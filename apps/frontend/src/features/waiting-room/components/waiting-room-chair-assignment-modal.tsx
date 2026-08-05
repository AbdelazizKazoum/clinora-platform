'use client';

import Icon from '@/components/wrappers/Icon';
import clsx from 'clsx';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';

import {
  getChairDisplayName,
  isChairSelectableForEntry,
  type WaitingRoomChair,
  type WaitingRoomEntry,
} from '../model';
import styles from './waiting-room-board.module.scss';
import WaitingRoomIconAvatar from './waiting-room-icon-avatar';

interface WaitingRoomChairAssignmentModalProps {
  chairs: WaitingRoomChair[];
  entries: WaitingRoomEntry[];
  entry: WaitingRoomEntry;
  error?: string | null;
  isSubmitting?: boolean;
  onHide: () => void;
  onManageChairs?: () => void;
  onSubmit: (chairId: string) => Promise<void> | void;
  show: boolean;
}

const WaitingRoomChairAssignmentModal = ({
  chairs,
  entries,
  entry,
  error = null,
  isSubmitting = false,
  onHide,
  onManageChairs,
  onSubmit,
  show,
}: WaitingRoomChairAssignmentModalProps) => {
  const [selectedChairId, setSelectedChairId] = useState('');
  const [showOccupied, setShowOccupied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectableChairs = useMemo(
    () => chairs.filter((chair) => isChairSelectableForEntry(chair, entry.id)),
    [chairs, entry.id],
  );
  const occupiedChairs = useMemo(
    () =>
      chairs.filter(
        (chair) =>
          chair.isActive &&
          !isChairSelectableForEntry(chair, entry.id) &&
          !chair.isAvailable,
      ),
    [chairs, entry.id],
  );
  const occupantNames = useMemo(
    () =>
      new Map(
        entries.map((candidate) => [candidate.id, candidate.patientName]),
      ),
    [entries],
  );

  useEffect(() => {
    if (!show) return;

    const currentChairIsSelectable =
      entry.status === 'IN_CHAIR' &&
      selectableChairs.some((chair) => chair.id === entry.chairId);
    setSelectedChairId(
      currentChairIsSelectable && entry.chairId ? entry.chairId : '',
    );
    setShowOccupied(false);
    setValidationError(null);
  }, [entry.chairId, entry.id, selectableChairs, show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedChair = selectableChairs.find(
      (chair) => chair.id === selectedChairId,
    );
    if (!selectedChair) {
      setValidationError(
        'Select an available chair before seating the patient.',
      );
      return;
    }

    setValidationError(null);
    await onSubmit(selectedChair.id);
  };

  const renderChairOption = (chair: WaitingRoomChair, disabled = false) => {
    const displayName = getChairDisplayName(chair);
    const occupantName = chair.occupiedByEntryId
      ? occupantNames.get(chair.occupiedByEntryId)
      : null;
    const isCurrent = chair.id === entry.chairId;
    const inputId = `waiting-room-chair-${chair.id}`;

    return (
      <label
        className={clsx(
          'd-flex align-items-center gap-3',
          styles.chairOption,
          selectedChairId === chair.id && styles.chairOptionSelected,
          disabled && styles.chairOptionDisabled,
        )}
        htmlFor={inputId}
        key={chair.id}
      >
        <Form.Check.Input
          aria-label={`Select ${displayName}`}
          checked={selectedChairId === chair.id}
          disabled={disabled || isSubmitting}
          id={inputId}
          name="waiting-room-chair"
          onChange={() => setSelectedChairId(chair.id)}
          type="radio"
        />
        <WaitingRoomIconAvatar icon="armchair" />
        <span className="min-w-0 flex-grow-1">
          <span className="d-flex flex-wrap align-items-center gap-2 fw-semibold">
            {displayName}
            {isCurrent && (
              <Badge bg="primary-subtle" className="text-primary">
                Current
              </Badge>
            )}
          </span>
          <span className="d-block text-muted fs-xs">
            {disabled
              ? occupantName
                ? `Occupied by ${occupantName}`
                : 'Currently occupied'
              : isCurrent
                ? 'Assigned to this patient'
                : 'Available now'}
          </span>
        </span>
        <Badge
          bg={disabled ? 'warning-subtle' : 'success-subtle'}
          className={disabled ? 'text-warning' : 'text-success'}
        >
          {disabled ? 'Occupied' : 'Available'}
        </Badge>
      </label>
    );
  };

  const isSeated = entry.status === 'IN_CHAIR';

  return (
    <Modal
      centered
      onHide={isSubmitting ? undefined : onHide}
      scrollable
      show={show}
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isSeated ? 'Change assigned chair' : 'Select a chair'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {(error || validationError) && (
            <Alert variant="danger">{error ?? validationError}</Alert>
          )}

          <div className="d-flex align-items-start gap-2 mb-3">
            <WaitingRoomIconAvatar icon="user-round-check" />
            <div>
              <p className="mb-1 fw-semibold">{entry.patientName}</p>
              <p className="text-muted fs-sm mb-0">
                {isSeated
                  ? 'Choose another available chair for this seated patient.'
                  : 'A patient must have an available chair before entering In Chair.'}
              </p>
            </div>
          </div>

          {selectableChairs.length > 0 ? (
            <div className="d-grid gap-2">
              {selectableChairs.map((chair) => renderChairOption(chair))}
            </div>
          ) : (
            <Alert className="mb-0" variant="warning">
              No active chair is currently available. Free an occupied chair or
              add another chair before seating this patient.
            </Alert>
          )}

          {occupiedChairs.length > 0 && (
            <div className="mt-3">
              <Button
                aria-expanded={showOccupied}
                className="px-0"
                disabled={isSubmitting}
                onClick={() => setShowOccupied((current) => !current)}
                type="button"
                variant="link"
              >
                <Icon
                  icon={showOccupied ? 'chevron-up' : 'chevron-down'}
                  className="me-1"
                />
                {showOccupied ? 'Hide' : 'Show'} occupied chairs (
                {occupiedChairs.length})
              </Button>

              {showOccupied && (
                <div className="d-grid gap-2 mt-1">
                  {occupiedChairs.map((chair) =>
                    renderChairOption(chair, true),
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          {onManageChairs && (
            <Button
              className="me-auto"
              disabled={isSubmitting}
              onClick={onManageChairs}
              type="button"
              variant="outline-secondary"
            >
              <Icon icon="settings-2" className="me-1" />
              Manage chairs
            </Button>
          )}
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || selectableChairs.length === 0}
            type="submit"
            variant="primary"
          >
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            {isSeated ? 'Update chair' : 'Seat patient'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WaitingRoomChairAssignmentModal;
