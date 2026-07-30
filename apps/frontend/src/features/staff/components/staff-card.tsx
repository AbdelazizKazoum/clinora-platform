'use client';

import Icon from '@/components/wrappers/Icon';
import { useState } from 'react';
import { Button, Card, CardBody, Dropdown } from 'react-bootstrap';

import {
  getAvailableStaffStatusTransitions,
  getStaffInitials,
  staffRoleLabels,
  staffStatusDotClassNames,
  staffStatusLabels,
  type StaffMember,
  type StaffStatus,
} from '../model';

const joinedDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'numeric',
  year: '2-digit',
});

const StaffAvatar = ({ staffMember }: { staffMember: StaffMember }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const statusLabel = staffStatusLabels[staffMember.status];
  const statusDotClassName = staffStatusDotClassNames[staffMember.status];

  return (
    <div
      className="position-relative flex-shrink-0"
      style={{ height: 72, width: 72 }}
    >
      {staffMember.avatar && !hasImageError ? (
        <img
          alt={`${staffMember.fullName} avatar`}
          className="rounded-circle"
          height={72}
          onError={() => setHasImageError(true)}
          src={staffMember.avatar}
          width={72}
        />
      ) : (
        <span className="avatar-title text-bg-primary fw-semibold rounded-circle fs-22 h-100 w-100">
          {getStaffInitials(staffMember)}
        </span>
      )}
      <span
        className={`position-absolute rounded-circle border border-2 border-white ${statusDotClassName}`}
        style={{ bottom: 5, height: 13, right: 5, width: 13 }}
        title={statusLabel}
      >
        <span className="visually-hidden">{statusLabel}</span>
      </span>
    </div>
  );
};

const getStatusActionLabel = (status: StaffStatus): string =>
  status === 'inactive'
    ? 'Deactivate Account'
    : `Mark ${staffStatusLabels[status]}`;

interface StaffCardProps {
  isActionPending?: boolean;
  canManage?: boolean;
  onEdit?: (staffMember: StaffMember) => void;
  onStatusChange?: (staffMember: StaffMember, status: StaffStatus) => void;
  staffMember: StaffMember;
}

const StaffCard = ({
  canManage = false,
  isActionPending = false,
  onEdit,
  onStatusChange,
  staffMember,
}: StaffCardProps) => (
  <Card className="h-100 border-0 shadow-sm">
    <CardBody>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <StaffAvatar staffMember={staffMember} />

        {canManage && onEdit && onStatusChange && (
          <Dropdown align="end">
            <Dropdown.Toggle
              aria-label={`Manage ${staffMember.fullName}`}
              as={Button}
              className="text-muted drop-arrow-none card-drop p-0 border-0"
              disabled={isActionPending}
              size="sm"
              variant="link"
            >
              <Icon icon="ellipsis" className="fs-24" />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onEdit(staffMember)}>
                <Icon icon="square-pen" className="me-2" />
                Edit
              </Dropdown.Item>
              <Dropdown.Divider />
              {getAvailableStaffStatusTransitions(staffMember.status).map(
                (status) => (
                  <Dropdown.Item
                    key={status}
                    onClick={() => onStatusChange(staffMember, status)}
                  >
                    <Icon icon="activity" className="me-2" />
                    {getStatusActionLabel(status)}
                  </Dropdown.Item>
                ),
              )}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      <h5 className="mb-1 text-truncate">{staffMember.fullName}</h5>
      <span className="text-muted fs-xs">
        {staffRoleLabels[staffMember.role]}
      </span>

      <hr className="my-3 border-dashed" />

      <div className="d-flex justify-content-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-muted fs-xs mb-1">Specialization</p>
          <h6 className="mb-0 text-truncate">
            {staffMember.specialization ?? 'Clinic staff'}
          </h6>
        </div>

        <div className="text-end flex-shrink-0">
          <p className="text-muted fs-xs mb-1">Joined Date</p>
          <h6 className="mb-0">
            {joinedDateFormatter.format(staffMember.createdAt)}
          </h6>
        </div>
      </div>

      <div className="d-grid gap-2">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <Icon icon="mail" className="text-muted flex-shrink-0" />
          <a
            className="link-reset text-truncate"
            href={`mailto:${staffMember.email}`}
          >
            {staffMember.email}
          </a>
        </div>

        <div className="d-flex align-items-center gap-2 min-w-0">
          <Icon icon="phone" className="text-muted flex-shrink-0" />
          {staffMember.phone ? (
            <a
              className="link-reset text-truncate"
              href={`tel:${staffMember.phone}`}
            >
              {staffMember.phone}
            </a>
          ) : (
            <span className="text-muted text-truncate">No phone on file</span>
          )}
        </div>
      </div>
    </CardBody>
  </Card>
);

export default StaffCard;
