import Icon from '@/components/wrappers/Icon';
import Link from 'next/link';
import { Button, Col, FormSelect, Row } from 'react-bootstrap';

import {
  STAFF_ROLES,
  STAFF_STATUSES,
  staffRoleLabels,
  staffStatusLabels,
  type StaffRoleFilter,
  type StaffStatusFilter,
} from '../model';

interface StaffToolbarProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRoleFilterChange: (role: StaffRoleFilter) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: StaffStatusFilter) => void;
  roleFilter: StaffRoleFilter;
  search: string;
  statusFilter: StaffStatusFilter;
}

const StaffToolbar = ({
  hasActiveFilters,
  onClearFilters,
  onRoleFilterChange,
  onSearchChange,
  onStatusFilterChange,
  roleFilter,
  search,
  statusFilter,
}: StaffToolbarProps) => (
  <form
    className="card border p-3 mb-3"
    onSubmit={(event) => event.preventDefault()}
  >
    <Row className="g-3 align-items-center">
      <Col xs={12} lg={4}>
        <div className="app-search">
          <input
            aria-label="Search staff"
            className="form-control"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search staff name..."
            type="search"
            value={search}
          />
          <Icon icon="search" className="app-search-icon text-muted" />
        </div>
      </Col>

      <Col xs={12} lg={8}>
        <div className="d-flex flex-wrap flex-xl-nowrap align-items-center justify-content-lg-end gap-2">
          <span className="me-2 fw-semibold flex-shrink-0">Filter By:</span>

          <div className="app-search flex-shrink-0">
            <FormSelect
              aria-label="Filter staff by role"
              className="form-control"
              onChange={(event) =>
                onRoleFilterChange(event.target.value as StaffRoleFilter)
              }
              value={roleFilter}
            >
              <option value="ALL">Roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {staffRoleLabels[role]}
                </option>
              ))}
            </FormSelect>
            <Icon icon="user-check" className="app-search-icon text-muted" />
          </div>

          <div className="app-search flex-shrink-0">
            <FormSelect
              aria-label="Filter staff by status"
              className="form-control"
              onChange={(event) =>
                onStatusFilterChange(event.target.value as StaffStatusFilter)
              }
              value={statusFilter}
            >
              <option value="ALL">Status</option>
              {STAFF_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {staffStatusLabels[status]}
                </option>
              ))}
            </FormSelect>
            <Icon icon="activity" className="app-search-icon text-muted" />
          </div>

          {hasActiveFilters && (
            <Button
              className="flex-shrink-0"
              onClick={onClearFilters}
              type="button"
              variant="secondary"
            >
              <Icon icon="x" className="me-1" />
              Clear
            </Button>
          )}

          <div className="ms-lg-auto flex-shrink-0">
            <Link className="btn btn-primary" href="/staff/new">
              <Icon icon="plus" className="me-1" />
              Add Staff Member
            </Link>
          </div>
        </div>
      </Col>
    </Row>
  </form>
);

export default StaffToolbar;
