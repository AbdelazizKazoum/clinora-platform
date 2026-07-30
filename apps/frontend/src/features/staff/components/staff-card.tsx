'use client';

import Icon from '@/components/wrappers/Icon';
import { useState } from 'react';
import { Button, Card, CardBody, Dropdown } from 'react-bootstrap';

import {
  getAvailableStaffStatusTransitions,
  getStaffInitials,
  staffRoleBadgeClassNames,
  staffRoleLabels,
  staffStatusBadgeClassNames,
  staffStatusLabels,
  type StaffMember,
  type StaffStatus,
} from '../model';

const joinedDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const StaffAvatar = ({ staffMember }: { staffMember: StaffMember }) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (staffMember.avatar && !hasImageError) {
    return (
      <img
        alt={`${staffMember.fullName} avatar`}
        className="rounded-circle me-3 flex-shrink-0"
        height={64}
        onError={() => setHasImageError(true)}
        src={staffMember.avatar}
        width={64}
      />
    );
  }

  return (
    <div
      className="avatar rounded-circle me-3 flex-shrink-0"
      style={{ height: 64, width: 64 }}
    >
      <span className="avatar-title text-bg-primary fw-semibold rounded-circle fs-22">
        {getStaffInitials(staffMember)}
      </span>
    </div>
  );
};

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
  <Card className="h-100">
    <CardBody className="d-flex align-items-start">
      <StaffAvatar staffMember={staffMember} />

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex flex-nowrap justify-content-between align-items-start gap-2">
          <div className="min-w-0">
            <h5 className="mb-1 text-truncate">{staffMember.fullName}</h5>
            <p className="mb-2 text-muted fs-xs">
              {staffMember.specialization ?? 'Clinic staff'}
            </p>
          </div>
          <div className="d-flex align-items-start gap-1 flex-shrink-0">
            <span
              className={`badge badge-label ${staffStatusBadgeClassNames[staffMember.status]}`}
            >
              {staffStatusLabels[staffMember.status]}
            </span>

            {canManage && onEdit && onStatusChange && (
              <Dropdown align="end">
                <Dropdown.Toggle
                  aria-label={`Manage ${staffMember.fullName}`}
                  as={Button}
                  className="btn-icon btn-sm rounded-circle"
                  disabled={isActionPending}
                  size="sm"
                  variant="light"
                >
                  <Icon icon="ellipsis-vertical" />
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
                        Mark {staffStatusLabels[status]}
                      </Dropdown.Item>
                    ),
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </div>

        <div className="mb-3">
          <span
            className={`badge ${staffRoleBadgeClassNames[staffMember.role]}`}
          >
            {staffRoleLabels[staffMember.role]}
          </span>
        </div>

        <div className="d-grid gap-2">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <div className="avatar-xs avatar-img-size fs-24 flex-shrink-0">
              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                <Icon icon="mail" />
              </span>
            </div>
            <a
              className="link-reset text-truncate"
              href={`mailto:${staffMember.email}`}
            >
              {staffMember.email}
            </a>
          </div>

          {staffMember.phone && (
            <div className="d-flex align-items-center gap-2 min-w-0">
              <div className="avatar-xs avatar-img-size fs-24 flex-shrink-0">
                <span className="avatar-title text-bg-light fs-sm rounded-circle">
                  <Icon icon="phone" />
                </span>
              </div>
              <a
                className="link-reset text-truncate"
                href={`tel:${staffMember.phone}`}
              >
                {staffMember.phone}
              </a>
            </div>
          )}

          <div className="d-flex align-items-center gap-2 text-muted">
            <div className="avatar-xs avatar-img-size fs-24 flex-shrink-0">
              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                <Icon icon="calendar-days" />
              </span>
            </div>
            <span>Joined {joinedDateFormatter.format(staffMember.createdAt)}</span>
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

export default StaffCard;
