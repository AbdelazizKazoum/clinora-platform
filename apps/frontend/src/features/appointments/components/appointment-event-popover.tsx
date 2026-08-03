'use client';

import Icon from '@/components/wrappers/Icon';
import {
  Button,
  Overlay,
  Popover,
  PopoverBody,
  PopoverHeader,
} from 'react-bootstrap';

import {
  appointmentStatusBadgeClassNames,
  appointmentStatusLabels,
  bookingChannelLabels,
  canCancelAppointment,
  canCheckInAppointment,
  type Appointment,
} from '../model';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface AppointmentEventPopoverProps {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
  onCheckIn: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onHide: () => void;
  show: boolean;
  target: HTMLElement | null;
}

const AppointmentEventPopover = ({
  appointment,
  onCancel,
  onCheckIn,
  onEdit,
  onHide,
  show,
  target,
}: AppointmentEventPopoverProps) => {
  const canCancel = canCancelAppointment(appointment);
  const canCheckIn = canCheckInAppointment(appointment);
  const serviceLabel = appointment.type ?? 'Appointment';
  const notesLabel = appointment.notes?.trim() || 'No notes';

  return (
    <Overlay
      onHide={onHide}
      placement="auto"
      rootClose
      show={show}
      target={target}
    >
      <Popover className="popover-primary" id="appointment-event-popover">
        <PopoverHeader
          as="div"
          className="d-flex align-items-start justify-content-between gap-2"
        >
          <div className="min-w-0">
            <h6 className="mb-1 text-truncate">{appointment.patientName}</h6>
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span
                className={`badge ${appointmentStatusBadgeClassNames[appointment.status]}`}
              >
                {appointmentStatusLabels[appointment.status]}
              </span>
              {appointment.isEmergency && (
                <span className="badge text-bg-danger">
                  Emergency
                </span>
              )}
            </div>
          </div>

          <Button
            aria-label="Close appointment details"
            className="btn-icon btn-sm flex-shrink-0"
            onClick={onHide}
            variant="link"
          >
            <Icon icon="x" />
          </Button>
        </PopoverHeader>

        <PopoverBody>
          <div className="d-grid gap-2">
            <div>
              <div className="text-muted fs-xs text-uppercase">Service</div>
              <div className="fw-medium">{serviceLabel}</div>
            </div>

            <div>
              <div className="text-muted fs-xs text-uppercase">Doctor</div>
              <div className="fw-medium">{appointment.doctorName}</div>
            </div>

            <div>
              <div className="text-muted fs-xs text-uppercase">Date & Time</div>
              <div className="fw-medium">
                {dateTimeFormatter.format(appointment.startAt)} -{' '}
                {dateTimeFormatter.format(appointment.endAt)}
              </div>
            </div>

            <div>
              <div className="text-muted fs-xs text-uppercase">Channel</div>
              <div className="fw-medium">
                {bookingChannelLabels[appointment.channel]}
              </div>
            </div>

            <div>
              <div className="text-muted fs-xs text-uppercase">Notes</div>
              <p className="mb-0 text-muted">{notesLabel}</p>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-end gap-2 border-top mt-3 pt-3">
            {canCancel && (
              <Button
                className="d-inline-flex align-items-center gap-1"
                onClick={() => onCancel(appointment)}
                size="sm"
                variant="outline-danger"
              >
                <Icon icon="ban" />
                Cancel
              </Button>
            )}
            {canCheckIn && (
              <Button
                className="d-inline-flex align-items-center gap-1"
                onClick={() => onCheckIn(appointment)}
                size="sm"
                variant="outline-success"
              >
                <Icon icon="clipboard-check" />
                Check In
              </Button>
            )}
            <Button
              className="d-inline-flex align-items-center gap-1"
              onClick={() => onEdit(appointment)}
              size="sm"
              variant="primary"
            >
              <Icon icon="pencil" />
              Edit
            </Button>
          </div>
        </PopoverBody>
      </Popover>
    </Overlay>
  );
};

export default AppointmentEventPopover;
