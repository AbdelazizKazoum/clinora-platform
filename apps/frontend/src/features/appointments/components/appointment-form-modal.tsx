'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';

import {
  APPOINTMENT_DURATION_OPTIONS,
  APPOINTMENT_STATUSES,
  BOOKING_CHANNELS,
  appointmentDurationLabels,
  appointmentStatusLabels,
  bookingChannelLabels,
  type Appointment,
  type AppointmentDurationOption,
  type AppointmentProvider,
  type AppointmentStatus,
  type BookingChannel,
} from '../model';
import {
  calculateAppointmentFormEndAt,
  createAppointmentFormValues,
  validateAppointmentForm,
  type AppointmentFormErrors,
  type AppointmentFormValues,
} from '../schemas';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface AppointmentFormModalProps {
  appointment: Appointment | null;
  defaultProvider: AppointmentProvider | null;
  initialStartAt: Date;
  isSubmitting?: boolean;
  submissionError?: string | null;
  onHide: () => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  onValuesChange?: () => void;
  providers: readonly AppointmentProvider[];
  show: boolean;
}

const AppointmentFormModal = ({
  appointment,
  defaultProvider,
  initialStartAt,
  isSubmitting = false,
  submissionError = null,
  onHide,
  onSubmit,
  onValuesChange,
  providers,
  show,
}: AppointmentFormModalProps) => {
  const [values, setValues] = useState<AppointmentFormValues>(() =>
    createAppointmentFormValues({
      appointment,
      defaultProvider,
      startAt: initialStartAt,
    }),
  );
  const [errors, setErrors] = useState<AppointmentFormErrors>({});

  useEffect(() => {
    if (!show) return;

    setValues(
      createAppointmentFormValues({
        appointment,
        defaultProvider,
        startAt: initialStartAt,
      }),
    );
    setErrors({});
  }, [appointment, defaultProvider, initialStartAt, show]);

  const endAt = useMemo(() => calculateAppointmentFormEndAt(values), [values]);
  const doctorOptions = useMemo<AppointmentProvider[]>(() => {
    if (
      !values.doctorId ||
      providers.some((provider) => provider.doctorId === values.doctorId)
    ) {
      return [...providers];
    }

    return [
      {
        avatar: null,
        colorClassName: 'bg-secondary-subtle text-secondary',
        doctorId: values.doctorId,
        initials: '',
        name: values.doctorName || 'Selected doctor',
      },
      ...providers,
    ];
  }, [providers, values.doctorId, values.doctorName]);
  const endAtLabel = endAt ? dateTimeFormatter.format(endAt) : '';
  const modalTitle = appointment ? 'Edit Appointment' : 'New Appointment';
  const submitLabel = appointment ? 'Save Changes' : 'Create Appointment';

  const updateValues = (nextValues: Partial<AppointmentFormValues>) => {
    setValues((currentValues) => ({
      ...currentValues,
      ...nextValues,
    }));
    onValuesChange?.();
  };

  const handleDoctorChange = (doctorId: string) => {
    const provider = doctorOptions.find(
      (candidate) => candidate.doctorId === doctorId,
    );

    updateValues({
      doctorId,
      doctorName: provider?.name ?? '',
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateAppointmentForm(values);
    setErrors(result.errors);

    if (!result.isValid) return;

    await onSubmit(values);
  };

  return (
    <Modal
      centered
      className="appointment-schedule-modal"
      onHide={isSubmitting ? undefined : onHide}
      show={show}
      size="lg"
    >
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{modalTitle}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {(errors.form || submissionError) && (
            <Alert variant="danger">{errors.form ?? submissionError}</Alert>
          )}

          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="appointment-patient-id">
                <Form.Label>Patient</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.patientId)}
                  onChange={(event) =>
                    updateValues({ patientId: event.target.value })
                  }
                  placeholder="Existing patient ID"
                  value={values.patientId}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="appointment-patient-name">
                <Form.Label>Patient Name</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.patientName)}
                  onChange={(event) =>
                    updateValues({ patientName: event.target.value })
                  }
                  value={values.patientName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="appointment-type">
                <Form.Label>Service</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.type)}
                  onChange={(event) =>
                    updateValues({ type: event.target.value })
                  }
                  placeholder="Consultation"
                  value={values.type}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.type}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="appointment-doctor">
                <Form.Label>Doctor</Form.Label>
                <Form.Select
                  disabled={isSubmitting || doctorOptions.length === 0}
                  isInvalid={Boolean(errors.doctorId)}
                  onChange={(event) => handleDoctorChange(event.target.value)}
                  value={values.doctorId}
                >
                  <option value="">Choose doctor</option>
                  {doctorOptions.map((provider) => (
                    <option key={provider.doctorId} value={provider.doctorId}>
                      {provider.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.doctorId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="appointment-start-at">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.startAt)}
                  onChange={(event) =>
                    updateValues({ startAt: event.target.value })
                  }
                  type="datetime-local"
                  value={values.startAt}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.startAt}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="appointment-duration">
                <Form.Label>Duration</Form.Label>
                <Form.Select
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.durationMinutes)}
                  onChange={(event) =>
                    updateValues({
                      durationMinutes: Number(
                        event.target.value,
                      ) as AppointmentDurationOption,
                    })
                  }
                  value={values.durationMinutes}
                >
                  {APPOINTMENT_DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {appointmentDurationLabels[duration]}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.durationMinutes}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="appointment-end-at">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  isInvalid={Boolean(errors.endAt)}
                  readOnly
                  value={endAtLabel}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.endAt}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="appointment-status">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.status)}
                  onChange={(event) =>
                    updateValues({
                      status: event.target.value as AppointmentStatus,
                    })
                  }
                  value={values.status}
                >
                  {APPOINTMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {appointmentStatusLabels[status]}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.status}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="appointment-channel">
                <Form.Label>Channel</Form.Label>
                <Form.Select
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.channel)}
                  onChange={(event) =>
                    updateValues({
                      channel: event.target.value as BookingChannel,
                    })
                  }
                  value={values.channel}
                >
                  {BOOKING_CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {bookingChannelLabels[channel]}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.channel}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="appointment-phone">
                <Form.Label>Phone</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="ti ti-phone" />
                  </InputGroup.Text>
                  <Form.Control
                    disabled={isSubmitting}
                    isInvalid={Boolean(errors.patientPhone)}
                    onChange={(event) =>
                      updateValues({ patientPhone: event.target.value })
                    }
                    value={values.patientPhone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.patientPhone}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Check
                checked={values.isEmergency}
                disabled={isSubmitting}
                id="appointment-emergency"
                label="Emergency override"
                onChange={(event) =>
                  updateValues({ isEmergency: event.target.checked })
                }
                type="switch"
              />
            </Col>

            <Col md={12}>
              <Form.Group controlId="appointment-notes">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  disabled={isSubmitting}
                  isInvalid={Boolean(errors.notes)}
                  onChange={(event) =>
                    updateValues({ notes: event.target.value })
                  }
                  rows={3}
                  value={values.notes}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.notes}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            {submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AppointmentFormModal;
