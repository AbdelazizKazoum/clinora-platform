'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { useNotificationStore } from '@/store';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Row } from 'react-bootstrap';

import StaffCard from '../components/staff-card';
import StaffCardSkeleton from '../components/staff-card-skeleton';
import StaffEditModal from '../components/staff-edit-modal';
import StaffSummaryCards from '../components/staff-summary-cards';
import StaffToolbar from '../components/staff-toolbar';
import { useStaffMembers, useUpdateStaffMember } from '../hooks';
import {
  filterStaffMembers,
  getStaffSummary,
  isStaffDeactivationStatus,
  staffStatusLabels,
  type StaffMember,
  type StaffRoleFilter,
  type StaffStatus,
  type StaffStatusFilter,
} from '../model';

const StaffGridSkeleton = () => (
  <Row>
    {Array.from({ length: 6 }, (_, index) => (
      <Col key={index} xs={12} md={6} xl={4} className="mb-3">
        <StaffCardSkeleton />
      </Col>
    ))}
  </Row>
);

const StaffSummarySkeleton = () => (
  <Row>
    {Array.from({ length: 4 }, (_, index) => (
      <Col key={index} xs={12} sm={6} xl={3}>
        <Card aria-hidden="true">
          <CardBody className="placeholder-glow">
            <div className="d-flex align-items-center justify-content-between">
              <div className="w-75">
                <span className="placeholder col-7 d-block mb-3" />
                <span className="placeholder col-4 d-block" />
              </div>
              <span
                className="placeholder rounded-circle"
                style={{ height: 40, width: 40 }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    ))}
  </Row>
);

const StaffPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const canManageStaff = session?.user.role === 'admin';
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('ALL');
  const [editingStaffMember, setEditingStaffMember] =
    useState<StaffMember | null>(null);
  const [pendingStatusStaffMemberId, setPendingStatusStaffMemberId] = useState<
    string | null
  >(null);
  const staffMembersQuery = useStaffMembers(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );
  const statusUpdateMutation = useUpdateStaffMember();

  const staffMembers = staffMembersQuery.data ?? [];
  const isInitialLoading =
    sessionStatus === 'loading' ||
    (staffMembersQuery.isLoading && staffMembers.length === 0);
  const hasActiveFilters =
    search.trim().length > 0 || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const summary = useMemo(
    () => getStaffSummary(staffMembers),
    [staffMembers],
  );
  const filteredStaffMembers = useMemo(
    () =>
      filterStaffMembers(staffMembers, {
        role: roleFilter,
        search,
        status: statusFilter,
      }),
    [roleFilter, search, staffMembers, statusFilter],
  );

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleStatusChange = async (
    staffMember: StaffMember,
    status: StaffStatus,
  ) => {
    if (
      isStaffDeactivationStatus(status) &&
      !window.confirm(
        `${staffMember.fullName} will lose access to Clinora when marked inactive. Continue?`,
      )
    ) {
      return;
    }

    try {
      setPendingStatusStaffMemberId(staffMember.id);
      await statusUpdateMutation.updateStaffMember({
        clinicId: staffMember.clinicId,
        staffMemberId: staffMember.id,
        status,
      });
      showNotification({
        message: `${staffMember.fullName} is now ${staffStatusLabels[status]}.`,
        title: 'Staff status updated',
        variant: 'success',
      });
    } catch (error) {
      showNotification({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update the staff status.',
        title: 'Staff request failed',
        variant: 'danger',
      });
    } finally {
      setPendingStatusStaffMemberId(null);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Staff Management" subtitle="Staff" />

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
        <Link className="btn btn-primary" href="/staff/new">
          <Icon icon="plus" className="me-1" />
          Add Staff Member
        </Link>
      </div>

      {isInitialLoading ? (
        <StaffSummarySkeleton />
      ) : (
        <StaffSummaryCards summary={summary} />
      )}

      <StaffToolbar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onRoleFilterChange={setRoleFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        search={search}
        statusFilter={statusFilter}
      />

      {!clinicId && sessionStatus === 'authenticated' && (
        <Alert variant="warning">
          This session is missing a clinic context. Staff members cannot be
          loaded.
        </Alert>
      )}

      {staffMembersQuery.isError && (
        <Alert
          className="d-flex flex-wrap align-items-center justify-content-between gap-2"
          variant="danger"
        >
          <span>
            {staffMembersQuery.error.message ||
              'Unable to load staff members.'}
          </span>
          <Button
            disabled={staffMembersQuery.isFetching}
            onClick={() => {
              void staffMembersQuery.refetch();
            }}
            size="sm"
            variant="outline-danger"
          >
            <Icon icon="refresh-cw" className="me-1" />
            Retry
          </Button>
        </Alert>
      )}

      {isInitialLoading ? (
        <StaffGridSkeleton />
      ) : (
        <>
          {!staffMembersQuery.isError && staffMembers.length === 0 && (
            <Card>
              <CardBody className="text-center py-5">
                <Icon icon="users" className="display-5 text-muted mb-3" />
                <h5>No staff members yet</h5>
                <p className="text-muted mb-0">
                  Add the first team member when you are ready to start managing
                  clinic access.
                </p>
              </CardBody>
            </Card>
          )}

          {!staffMembersQuery.isError &&
            staffMembers.length > 0 &&
            filteredStaffMembers.length === 0 && (
              <Card>
                <CardBody className="text-center py-5">
                  <Icon
                    icon="search-x"
                    className="display-5 text-muted mb-3"
                  />
                  <h5>No staff match these filters</h5>
                  <p className="text-muted mb-3">
                    Try a different search term, role, or status.
                  </p>
                  <Button onClick={clearFilters} variant="outline-secondary">
                    Clear filters
                  </Button>
                </CardBody>
              </Card>
            )}

          {filteredStaffMembers.length > 0 && (
            <Row>
              {filteredStaffMembers.map((staffMember) => (
                <Col key={staffMember.id} xs={12} md={6} xl={4} className="mb-3">
                  <StaffCard
                    canManage={canManageStaff}
                    isActionPending={
                      pendingStatusStaffMemberId === staffMember.id
                    }
                    onEdit={setEditingStaffMember}
                    onStatusChange={(member, status) => {
                      void handleStatusChange(member, status);
                    }}
                    staffMember={staffMember}
                  />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      <StaffEditModal
        onHide={() => setEditingStaffMember(null)}
        staffMember={editingStaffMember}
      />
    </>
  );
};

export default StaffPage;
