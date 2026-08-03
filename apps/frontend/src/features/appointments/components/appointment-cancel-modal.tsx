'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

import type { Appointment } from '../model';

interface AppointmentCancelModalProps {
  appointment: Appointment;
  error?: string | null;
  isSubmitting?: boolean;
  onHide: () => void;
  onSubmit: (cancellationReason: string) => Promise<void> | void;
  show: boolean;
}

const AppointmentCancelModal = ({
  appointment,
  error = null,
  isSubmitting = false,
  onHide,
  onSubmit,
  show,
}: AppointmentCancelModalProps) => {
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (show) {
      setCancellationReason('');
    }
  }, [appointment.id, show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit(cancellationReason);
  };

  return (
    <Modal
      centered
      className="appointment-schedule-modal"
      onHide={isSubmitting ? undefined : onHide}
      show={show}
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Cancel Appointment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p className="mb-3">
            Cancel appointment for{' '}
            <span className="fw-semibold">{appointment.patientName}</span>?
          </p>

          <Form.Group controlId="appointment-cancellation-reason">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              as="textarea"
              disabled={isSubmitting}
              onChange={(event) => setCancellationReason(event.target.value)}
              rows={3}
              value={cancellationReason}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Keep Appointment
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="danger">
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            Cancel Appointment
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AppointmentCancelModal;
