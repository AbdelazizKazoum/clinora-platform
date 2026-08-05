'use client';

import Icon from '@/components/wrappers/Icon';
import clsx from 'clsx';
import { Badge, Button, Offcanvas } from 'react-bootstrap';

import {
  canLaunchTreatmentFromWaitingRoom,
  getEntryChairLabel,
  getWaitingRoomPatientInitials,
  queuePriorityBadgeClassNames,
  queuePriorityLabels,
  queueStatusBadgeClassNames,
  queueStatusLabels,
  type WaitingRoomEntry,
} from '../model';
import styles from './waiting-room-board.module.scss';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface TimelineItem {
  date: Date | null;
  description: string;
  icon: string;
  title: string;
}

const getTimeline = (entry: WaitingRoomEntry): TimelineItem[] => [
  {
    date: entry.arrivedAt,
    description: 'Patient checked in at reception.',
    icon: 'log-in',
    title: 'Arrived',
  },
  {
    date: entry.calledAt,
    description: 'Patient was called from the waiting area.',
    icon: 'bell-ring',
    title: 'Called',
  },
  {
    date: entry.seatedAt,
    description: 'Patient was seated for the visit.',
    icon: 'armchair',
    title: 'Seated',
  },
  {
    date: entry.completedAt,
    description: 'Waiting-room flow was completed.',
    icon: 'circle-check-big',
    title: 'Completed',
  },
];

const Detail = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="d-flex align-items-start gap-2 min-w-0">
    <Icon icon={icon} className="text-muted flex-shrink-0 mt-1" />
    <div className="min-w-0">
      <span className="text-muted fs-xs d-block">{label}</span>
      <span className={`fw-semibold ${styles.patientDetailValue}`}>
        {value}
      </span>
    </div>
  </div>
);

interface WaitingRoomPatientDetailsPanelProps {
  canEditNotes: boolean;
  entry: WaitingRoomEntry | null;
  isInteractionDisabled: boolean;
  onEditNotes: (entry: WaitingRoomEntry) => void;
  onHide: () => void;
  onStartTreatment: (entry: WaitingRoomEntry) => void;
}

const WaitingRoomPatientDetailsPanel = ({
  canEditNotes,
  entry,
  isInteractionDisabled,
  onEditNotes,
  onHide,
  onStartTreatment,
}: WaitingRoomPatientDetailsPanelProps) => {
  const chairLabel = entry ? getEntryChairLabel(entry) : null;

  return (
    <Offcanvas
      className={styles.patientDetailsPanel}
      onHide={onHide}
      placement="end"
      show={entry !== null}
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title as="h5">Patient details</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="p-0">
        {entry && (
          <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <span
                  className={clsx(
                    'avatar-lg flex-shrink-0',
                    styles.patientDetailsAvatar,
                  )}
                >
                  <span className="avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold">
                    {getWaitingRoomPatientInitials(entry.patientName)}
                  </span>
                </span>
                <div className="min-w-0">
                  <h4 className="text-truncate mb-1">{entry.patientName}</h4>
                  <div className="d-flex flex-wrap gap-1">
                    <Badge
                      bg="transparent"
                      className={queueStatusBadgeClassNames[entry.status]}
                    >
                      {queueStatusLabels[entry.status]}
                    </Badge>
                    <Badge
                      bg="transparent"
                      className={queuePriorityBadgeClassNames[entry.priority]}
                    >
                      {queuePriorityLabels[entry.priority]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-bottom">
              <h6 className="text-uppercase text-muted fs-xs mb-3">
                Visit summary
              </h6>
              <div className={styles.patientDetailsGrid}>
                <Detail
                  icon="calendar-days"
                  label="Appointment"
                  value={entry.appointmentType ?? 'Dental appointment'}
                />
                <Detail
                  icon="stethoscope"
                  label="Doctor"
                  value={entry.doctorName}
                />
                <Detail
                  icon="phone"
                  label="Phone"
                  value={entry.patientPhone ?? 'Not on file'}
                />
                <Detail
                  icon="armchair"
                  label="Chair"
                  value={chairLabel ?? 'Not assigned'}
                />
              </div>
            </div>

            <div className="p-3 border-bottom">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h6 className="text-uppercase text-muted fs-xs mb-0">
                  Queue notes
                </h6>
                {canEditNotes && (
                  <Button
                    aria-label={`Edit notes for ${entry.patientName}`}
                    className="btn-icon"
                    disabled={isInteractionDisabled}
                    onClick={() => onEditNotes(entry)}
                    size="sm"
                    title="Edit queue notes"
                    variant="outline-secondary"
                  >
                    <Icon icon="pencil" />
                  </Button>
                )}
              </div>
              <p
                className={clsx(
                  'mb-0 text-break',
                  !entry.queueNotes && 'text-muted fst-italic',
                )}
              >
                {entry.queueNotes ?? 'No queue notes recorded.'}
              </p>
            </div>

            <div className="p-3 flex-grow-1">
              <h6 className="text-uppercase text-muted fs-xs mb-3">
                Status timeline
              </h6>
              <div className="timeline timeline-icon-bordered">
                {getTimeline(entry).map((item) => (
                  <div
                    className="timeline-item d-flex align-items-stretch"
                    key={item.title}
                  >
                    <span
                      className={clsx(
                        'timeline-dot flex-shrink-0',
                        item.date
                          ? 'border-success text-success'
                          : 'text-muted',
                      )}
                    >
                      <Icon icon={item.icon} className="fs-sm" />
                    </span>
                    <div className="timeline-content ps-3 pb-4">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <h6 className="mb-1">{item.title}</h6>
                        <span className="text-muted fs-xs text-end">
                          {item.date
                            ? dateTimeFormatter.format(item.date)
                            : 'Not recorded'}
                        </span>
                      </div>
                      <p className="text-muted fs-xs mb-0">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-top p-3 d-grid gap-2">
              {canLaunchTreatmentFromWaitingRoom(entry) && (
                <Button
                  disabled={isInteractionDisabled}
                  onClick={() => onStartTreatment(entry)}
                >
                  <Icon icon="play" className="me-2" />
                  Start Treatment
                </Button>
              )}
              <div className="d-flex gap-2">
                {entry.patientPhone && (
                  <Button
                    className="flex-grow-1"
                    href={`tel:${entry.patientPhone}`}
                    variant="outline-secondary"
                  >
                    <Icon icon="phone" className="me-2" />
                    Call
                  </Button>
                )}
                {canEditNotes && (
                  <Button
                    className="flex-grow-1"
                    disabled={isInteractionDisabled}
                    onClick={() => onEditNotes(entry)}
                    variant="outline-secondary"
                  >
                    <Icon icon="notebook-pen" className="me-2" />
                    Edit notes
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default WaitingRoomPatientDetailsPanel;
