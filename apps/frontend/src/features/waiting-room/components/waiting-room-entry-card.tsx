'use client';

import Icon from '@/components/wrappers/Icon';
import clsx from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, Card, CardBody, Dropdown } from 'react-bootstrap';
import { createPortal } from 'react-dom';

import {
  canLaunchTreatmentFromWaitingRoom,
  getEntryChairLabel,
  getWaitingRoomPatientInitials,
  queuePriorityBadgeClassNames,
  queuePriorityLabels,
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

const WaitingRoomActionsPortal = ({ children }: { children: ReactNode }) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  return portalRoot ? createPortal(children, portalRoot) : null;
};

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
  canManageQueue: boolean;
  entry: WaitingRoomEntry;
  isDragEnabled: boolean;
  isDragging?: boolean;
  isInteractionDisabled: boolean;
  isRecentlyUpdated: boolean;
  onAssignChair?: (entry: WaitingRoomEntry) => void;
  onEditNotes: (entry: WaitingRoomEntry) => void;
  onSelect: (entry: WaitingRoomEntry) => void;
  onStartTreatment: (entry: WaitingRoomEntry) => void;
}

const WaitingRoomEntryCard = ({
  canManageQueue,
  entry,
  isDragEnabled,
  isDragging = false,
  isInteractionDisabled,
  isRecentlyUpdated,
  onAssignChair,
  onEditNotes,
  onSelect,
  onStartTreatment,
}: WaitingRoomEntryCardProps) => {
  const timing = getEntryTiming(entry);
  const chairLabel = getEntryChairLabel(entry);
  const canStartTreatment = canLaunchTreatmentFromWaitingRoom(entry);

  return (
    <Card
      className={clsx(
        'border-0 shadow-sm mb-2',
        styles.entryCard,
        priorityCardClassNames[entry.priority],
        isDragging && 'shadow-lg',
        isRecentlyUpdated && styles.recentlyUpdated,
      )}
    >
      <CardBody className="p-3">
        <div
          className={`d-flex align-items-start gap-2 mb-3 ${styles.entryHeader}`}
        >
          <span
            className={clsx(
              'avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold flex-shrink-0',
              styles.patientAvatar,
            )}
          >
            {getWaitingRoomPatientInitials(entry.patientName)}
          </span>

          <div className={`flex-grow-1 ${styles.entryIdentity}`}>
            <div
              className={`d-flex align-items-center gap-1 ${styles.entryIdentity}`}
            >
              <h5 className={`mb-0 ${styles.entryNameHeading}`}>
                <Button
                  aria-label={`View details for ${entry.patientName}`}
                  className={`border-0 p-0 fw-semibold text-body text-decoration-none ${styles.entryNameButton}`}
                  onClick={() => onSelect(entry)}
                  title={entry.patientName}
                  variant="link"
                >
                  {entry.patientName}
                </Button>
              </h5>
              <span
                className={`badge flex-shrink-0 ${queuePriorityBadgeClassNames[entry.priority]}`}
              >
                {queuePriorityLabels[entry.priority]}
              </span>
            </div>
            <span
              className={`text-muted fs-xs ${styles.truncateText}`}
              title={entry.appointmentType ?? 'Dental appointment'}
            >
              {entry.appointmentType ?? 'Dental appointment'}
            </span>
            {isRecentlyUpdated && (
              <span
                aria-label="Recently updated from live queue"
                className={`badge badge-soft-success text-success mt-1 ${styles.liveUpdateBadge}`}
              >
                <Icon icon="radio" className="me-1" />
                Updated
              </span>
            )}
          </div>

          <Dropdown className="ms-auto flex-shrink-0">
            <Dropdown.Toggle
              aria-label={`Actions for ${entry.patientName}`}
              as={Button}
              className="btn btn-icon btn-sm drop-arrow-none btn-ghost-light text-muted content-none"
              type="button"
              variant="ghost-light"
            >
              <Icon icon="ellipsis-vertical" className="fs-xl" />
            </Dropdown.Toggle>
            <WaitingRoomActionsPortal>
              <Dropdown.Menu align="end" className={styles.entryActionMenu}>
                <Dropdown.Item
                  as="button"
                  onClick={() => onSelect(entry)}
                  type="button"
                >
                  <Icon icon="panel-right-open" className="me-2" />
                  View details
                </Dropdown.Item>
                {canStartTreatment && (
                  <Dropdown.Item
                    as="button"
                    disabled={isInteractionDisabled}
                    onClick={() => onStartTreatment(entry)}
                    type="button"
                  >
                    <Icon icon="play" className="me-2" />
                    Start Treatment
                  </Dropdown.Item>
                )}
                {canManageQueue && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      as="button"
                      disabled={isInteractionDisabled}
                      onClick={() => onEditNotes(entry)}
                      type="button"
                    >
                      <Icon icon="notebook-pen" className="me-2" />
                      Edit notes
                    </Dropdown.Item>
                    {entry.status === 'IN_CHAIR' && onAssignChair && (
                      <Dropdown.Item
                        as="button"
                        disabled={isInteractionDisabled}
                        onClick={() => onAssignChair(entry)}
                        type="button"
                    >
                      <Icon icon="armchair" className="me-2" />
                      Change chair
                    </Dropdown.Item>
                    )}
                  </>
                )}
                <Dropdown.Divider />
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
            </WaitingRoomActionsPortal>
          </Dropdown>
        </div>

        <div className={`d-grid gap-2 fs-sm ${styles.entryDetails}`}>
          <div
            className={`d-flex align-items-center gap-2 ${styles.entryDetailRow}`}
          >
            <Icon icon="stethoscope" className="text-muted flex-shrink-0" />
            <span
              className={`${styles.truncateText} ${styles.flexTruncateText}`}
              title={entry.doctorName}
            >
              {entry.doctorName}
            </span>
          </div>

          {entry.status === 'IN_CHAIR' && chairLabel && (
            <div
              className={`d-flex align-items-center gap-2 ${styles.entryDetailRow}`}
            >
              <span
                className={`badge badge-soft-primary text-primary d-inline-flex align-items-center gap-1 ${styles.entryBadge}`}
                title={chairLabel}
              >
                <Icon icon="armchair" className="flex-shrink-0" />
                <span
                  className={`${styles.truncateText} ${styles.flexTruncateText}`}
                >
                  {chairLabel}
                </span>
              </span>
            </div>
          )}

          {entry.queueNotes && (
            <div
              className={`d-flex align-items-start gap-2 ${styles.entryDetailRow}`}
            >
              <Icon
                icon="notebook-pen"
                className="text-warning flex-shrink-0 mt-1"
              />
              <span
                className={`text-muted ${styles.truncateText} ${styles.flexTruncateText}`}
                title={entry.queueNotes}
              >
                {entry.queueNotes}
              </span>
            </div>
          )}
        </div>

        {canStartTreatment && (
          <Button
            className="w-100 mt-3"
            disabled={isInteractionDisabled}
            onClick={() => onStartTreatment(entry)}
            size="sm"
          >
            <Icon icon="play" className="me-2" />
            Start Treatment
          </Button>
        )}

        <hr className="border-dashed my-3" />

        <div
          className={`d-flex align-items-center justify-content-between gap-2 text-muted fs-xs ${styles.entryFooter}`}
        >
          <span
            className={`d-flex align-items-center gap-1 ${styles.entryTiming}`}
          >
            <Icon icon="clock-3" className="flex-shrink-0" />
            <span
              className={`${styles.truncateText} ${styles.flexTruncateText}`}
            >
              {timing.label} {getElapsedTimeLabel(timing.date)}
              <span aria-hidden="true"> &middot; </span>
              {timeFormatter.format(timing.date)}
            </span>
          </span>
          <span
            className={clsx(
              'd-flex align-items-center gap-1 flex-shrink-0',
              isDragEnabled && styles.dragIndicator,
            )}
            title={
              isDragEnabled
                ? `Drag card to move ${entry.patientName}`
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
