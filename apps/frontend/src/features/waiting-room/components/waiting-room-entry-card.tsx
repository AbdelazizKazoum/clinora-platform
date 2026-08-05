'use client';

import Icon from '@/components/wrappers/Icon';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import clsx from 'clsx';
import { Button, Card, CardBody, Dropdown } from 'react-bootstrap';

import {
  getEntryChairLabel,
  getWaitingRoomPatientInitials,
  queuePriorityBadgeClassNames,
  queuePriorityLabels,
  type QueueStatus,
  type WaitingRoomEntry,
} from '../model';
import styles from './waiting-room-board.module.scss';

const timeFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
});

const priorityCardClassNames = {
  EMERGENCY: styles.priorityEmergency,
  NORMAL: styles.priorityNormal,
  URGENT: styles.priorityUrgent,
} as const;

const getElapsedTimeLabel = (date: Date): string => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );

  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const getEntryTiming = (
  entry: WaitingRoomEntry,
): { date: Date; label: string } => {
  const timingByStatus: Record<
    QueueStatus,
    { date: Date | null; label: string }
  > = {
    ARRIVED: { date: entry.arrivedAt, label: 'Arrived' },
    WAITING: { date: entry.calledAt ?? entry.arrivedAt, label: 'Waiting' },
    IN_CHAIR: { date: entry.seatedAt ?? entry.arrivedAt, label: 'Seated' },
    DONE: { date: entry.completedAt ?? entry.updatedAt, label: 'Completed' },
  };

  return {
    date: timingByStatus[entry.status].date ?? entry.arrivedAt,
    label: timingByStatus[entry.status].label,
  };
};

interface WaitingRoomEntryCardProps {
  dragHandleProps?: DraggableProvidedDragHandleProps;
  entry: WaitingRoomEntry;
  isDragging?: boolean;
  onAssignChair?: (entry: WaitingRoomEntry) => void;
}

const WaitingRoomEntryCard = ({
  dragHandleProps,
  entry,
  isDragging = false,
  onAssignChair,
}: WaitingRoomEntryCardProps) => {
  const timing = getEntryTiming(entry);
  const chairLabel = getEntryChairLabel(entry);

  return (
    <Card
      className={clsx(
        'border-0 shadow-sm mb-2',
        priorityCardClassNames[entry.priority],
        isDragging && 'shadow-lg',
      )}
    >
      <CardBody className="p-3">
        <div className="d-flex align-items-start gap-2 mb-3">
          <span
            className={clsx(
              'avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold flex-shrink-0',
              styles.patientAvatar,
            )}
          >
            {getWaitingRoomPatientInitials(entry.patientName)}
          </span>

          <div className="min-w-0 flex-grow-1">
            <div className="d-flex align-items-center gap-1">
              <h5 className="mb-0 fw-semibold text-truncate">
                {entry.patientName}
              </h5>
              <span
                className={`badge flex-shrink-0 ${queuePriorityBadgeClassNames[entry.priority]}`}
              >
                {queuePriorityLabels[entry.priority]}
              </span>
            </div>
            <span className="text-muted fs-xs text-truncate d-block">
              {entry.appointmentType ?? 'Dental appointment'}
            </span>
          </div>

          <Dropdown align="end" className="flex-shrink-0">
            <Dropdown.Toggle
              aria-label={`Actions for ${entry.patientName}`}
              as={Button}
              className="btn-icon btn-sm drop-arrow-none card-drop border-0 text-muted"
              variant="ghost-light"
            >
              <Icon icon="ellipsis-vertical" className="fs-lg" />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {entry.status === 'IN_CHAIR' && onAssignChair && (
                <>
                  <Dropdown.Item
                    as="button"
                    onClick={() => onAssignChair(entry)}
                    type="button"
                  >
                    <Icon icon="armchair" className="me-2" />
                    Change chair
                  </Dropdown.Item>
                  <Dropdown.Divider />
                </>
              )}
              {entry.patientPhone ? (
                <>
                  <Dropdown.Item href={`tel:${entry.patientPhone}`}>
                    <Icon icon="phone" className="me-2" />
                    Call patient
                  </Dropdown.Item>
                  <Dropdown.Item href={`sms:${entry.patientPhone}`}>
                    <Icon icon="message-circle" className="me-2" />
                    Send text
                  </Dropdown.Item>
                </>
              ) : (
                <Dropdown.Item disabled>
                  <Icon icon="phone-off" className="me-2" />
                  No phone on file
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div className="d-grid gap-2 fs-sm">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <Icon icon="stethoscope" className="text-muted flex-shrink-0" />
            <span className="text-truncate">{entry.doctorName}</span>
          </div>

          {entry.status === 'IN_CHAIR' && chairLabel && (
            <div className="d-flex align-items-center gap-2 min-w-0">
              <span className="badge badge-soft-primary text-primary d-inline-flex align-items-center gap-1 text-truncate">
                <Icon icon="armchair" className="flex-shrink-0" />
                {chairLabel}
              </span>
            </div>
          )}

          {entry.queueNotes && (
            <div className="d-flex align-items-start gap-2 min-w-0">
              <Icon
                icon="notebook-pen"
                className="text-warning flex-shrink-0 mt-1"
              />
              <span
                className="text-muted text-truncate"
                title={entry.queueNotes}
              >
                {entry.queueNotes}
              </span>
            </div>
          )}
        </div>

        <hr className="border-dashed my-3" />

        <div className="d-flex align-items-center justify-content-between gap-2 text-muted fs-xs">
          <span className="d-flex align-items-center gap-1">
            <Icon icon="clock-3" />
            {timing.label} {getElapsedTimeLabel(timing.date)}
            <span aria-hidden="true">·</span>
            {timeFormatter.format(timing.date)}
          </span>
          <span
            {...dragHandleProps}
            className={clsx(
              'd-flex align-items-center gap-1 flex-shrink-0',
              dragHandleProps && styles.dragHandle,
            )}
            title={
              dragHandleProps
                ? `Move ${entry.patientName}`
                : entry.manualOrder === null
                  ? 'Automatically ordered by priority and arrival time'
                  : `Manual queue position ${entry.manualOrder}`
            }
          >
            <Icon icon="grip-vertical" />
            {entry.manualOrder === null ? 'Auto' : `#${entry.manualOrder}`}
          </span>
        </div>
      </CardBody>
    </Card>
  );
};

export default WaitingRoomEntryCard;
