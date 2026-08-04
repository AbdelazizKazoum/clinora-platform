'use client';

import Icon from '@/components/wrappers/Icon';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

import {
  queueStatusLabels,
  type QueueStatus,
  type WaitingRoomEntry,
} from '../model';

interface WaitingRoomCorrectionModalProps {
  destinationStatus: QueueStatus;
  entry: WaitingRoomEntry;
  error?: string | null;
  isSubmitting?: boolean;
  onHide: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
  show: boolean;
}

const WaitingRoomCorrectionModal = ({
  destinationStatus,
  entry,
  error = null,
  isSubmitting = false,
  onHide,
  onSubmit,
  show,
}: WaitingRoomCorrectionModalProps) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setReason('');
      setValidationError(null);
    }
  }, [destinationStatus, entry.id, show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      setValidationError('Enter a reason for correcting this queue status.');
      return;
    }

    setValidationError(null);
    await onSubmit(normalizedReason);
  };

  return (
    <Modal centered onHide={isSubmitting ? undefined : onHide} show={show}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Correct queue status</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {(error || validationError) && (
            <Alert variant="danger">{error ?? validationError}</Alert>
          )}

          <div className="d-flex align-items-start gap-2 mb-3">
            <span className="avatar-sm avatar-title rounded bg-warning-subtle text-warning flex-shrink-0">
              <Icon icon="history" />
            </span>
            <div>
              <p className="mb-1">
                Move <span className="fw-semibold">{entry.patientName}</span>{' '}
                back from {queueStatusLabels[entry.status]} to{' '}
                {queueStatusLabels[destinationStatus]}?
              </p>
              <p className="text-muted fs-sm mb-0">
                The reason is recorded in the queue notes for audit context.
              </p>
            </div>
          </div>

          <Form.Group controlId="waiting-room-correction-reason">
            <Form.Label>Correction reason</Form.Label>
            <Form.Control
              as="textarea"
              autoFocus
              disabled={isSubmitting}
              isInvalid={Boolean(validationError)}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why the patient is moving backward..."
              rows={3}
              value={reason}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Keep current status
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="warning">
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            Confirm correction
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WaitingRoomCorrectionModal;
