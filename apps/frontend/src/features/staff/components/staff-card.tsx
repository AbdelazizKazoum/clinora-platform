'use client';

import Icon from '@/components/wrappers/Icon';
import { useState } from 'react';
import { Card, CardBody } from 'react-bootstrap';

import {
  getStaffInitials,
  staffRoleBadgeClassNames,
  staffRoleLabels,
  staffStatusBadgeClassNames,
  staffStatusLabels,
  type StaffMember,
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

const StaffCard = ({ staffMember }: { staffMember: StaffMember }) => (
  <Card className="h-100">
    <CardBody className="d-flex align-items-start">
      <StaffAvatar staffMember={staffMember} />

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div className="min-w-0">
            <h5 className="mb-1 text-truncate">{staffMember.fullName}</h5>
            <p className="mb-2 text-muted fs-xs">
              {staffMember.specialization ?? 'Clinic staff'}
            </p>
          </div>
          <span
            className={`badge badge-label ${staffStatusBadgeClassNames[staffMember.status]}`}
          >
            {staffStatusLabels[staffMember.status]}
          </span>
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
