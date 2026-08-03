'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';

import {
  QUEUE_PRIORITIES,
  queuePriorityLabels,
  type Appointment,
  type QueuePriority,
} from '../model';
import {
  createAppointmentCheckInFormValues,
  type AppointmentCheckInFormValues,
} from '../schemas';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface AppointmentCheckInModalProps {
  appointment: Appointment;
  error?: string | null;
  isSubmitting?: boolean;
  onHide: () => void;
  onSubmit: (values: AppointmentCheckInFormValues) => Promise<void> | void;
  show: boolean;
}

const AppointmentCheckInModal = ({
  appointment,
  error = null,
  isSubmitting = false,
  onHide,
  onSubmit,
  show,
}: AppointmentCheckInModalProps) => {
  const [values, setValues] = useState<AppointmentCheckInFormValues>(() =>
    createAppointmentCheckInFormValues(appointment),
  );

  useEffect(() => {
    if (show) {
      setValues(createAppointmentCheckInFormValues(appointment));
    }
  }, [appointment, show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit(values);
  };

  return (
    <Modal centered onHide={isSubmitting ? undefined : onHide} show={show}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Check In Appointment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="g-3">
            <Col xs={12}>
              <div className="border rounded p-3">
                <div className="fw-semibold">{appointment.patientName}</div>
                <div className="text-muted fs-sm">
                  {appointment.type ?? 'Appointment'} with{' '}
                  {appointment.doctorName}
                </div>
                <div className="text-muted fs-sm">
                  {dateTimeFormatter.format(appointment.startAt)}
                </div>
              </div>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="appointment-check-in-priority">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      priority: event.target.value as QueuePriority,
                    }))
                  }
                  value={values.priority}
                >
                  {QUEUE_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {queuePriorityLabels[priority]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="appointment-check-in-notes">
                <Form.Label>Arrival Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      queueNotes: event.target.value,
                    }))
                  }
                  rows={3}
                  value={values.queueNotes}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="success">
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            Check In
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AppointmentCheckInModal;
