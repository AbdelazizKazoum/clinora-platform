'use client';

import user1 from '@/assets/images/users/user-1.jpg';
import user2 from '@/assets/images/users/user-2.jpg';
import user3 from '@/assets/images/users/user-3.jpg';
import user4 from '@/assets/images/users/user-4.jpg';
import user5 from '@/assets/images/users/user-5.jpg';
import user6 from '@/assets/images/users/user-6.jpg';
import DataTable from '@/components/table/DataTable';
import DeleteConfirmationModal from '@/components/table/delete-confirmation-modal';
import TablePagination from '@/components/table/TablePagination';
import Icon from '@/components/wrappers/Icon';
import { useNotificationStore, usePatientStore } from '@/store';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type FilterFn,
  type Row as TableRow,
  type SortingState,
  type Table as TableType,
  useReactTable,
} from '@tanstack/react-table';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  FormSelect,
} from 'react-bootstrap';
import {
  PATIENT_STATUSES,
  type Patient,
  type PatientStatus,
  type UpdatePatientCommand,
} from '../model';
import { formatPatientDate, formatPatientEnum } from '../utils/patient-display';
import PatientDetailsModal from './patient-details-modal';
import PatientEditModal from './patient-edit-modal';

const columnHelper = createColumnHelper<Patient>();
const patientAvatars = [user1, user2, user3, user4, user5, user6];

const statusClassName: Record<PatientStatus, string> = {
  ACTIVE: 'bg-success-subtle text-success',
  INACTIVE: 'bg-warning-subtle text-warning',
  ARCHIVED: 'bg-secondary-subtle text-secondary',
};

type PatientDateFilter =
  | 'ALL'
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'OLDER_THAN_30_DAYS';

const matchesDateFilter = (
  createdAt: Date,
  filter: PatientDateFilter,
  today: Date,
): boolean => {
  if (filter === 'ALL') return true;

  const createdDate = new Date(createdAt);
  createdDate.setHours(0, 0, 0, 0);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 6);

  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 29);

  switch (filter) {
    case 'TODAY':
      return createdDate.getTime() === today.getTime();
    case 'LAST_7_DAYS':
      return createdDate >= last7Days && createdDate <= today;
    case 'LAST_30_DAYS':
      return createdDate >= last30Days && createdDate <= today;
    case 'OLDER_THAN_30_DAYS':
      return createdDate < last30Days;
  }
};

const getPatientAvatar = (patientId: string): StaticImageData => {
  const hash = Array.from(patientId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return patientAvatars[hash % patientAvatars.length];
};

const patientGlobalFilter: FilterFn<Patient> = (row, _columnId, value) => {
  const search = String(value).trim().toLowerCase();
  if (!search) return true;

  const patient = row.original;
  return [
    patient.firstName,
    patient.lastName,
    patient.email,
    patient.phone,
    patient.gender,
    patient.status,
  ].some((field) => field?.toLowerCase().includes(search));
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to update patients.';

const PatientTable = () => {
  const patients = usePatientStore((state) => state.patients);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const deletePatient = usePatientStore((state) => state.deletePatient);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<PatientDateFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>(
    'ALL',
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {},
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewedPatient, setViewedPatient] = useState<Patient | null>(null);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);

  const visiblePatients = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return patients.filter((patient) => {
      const matchesStatus =
        statusFilter === 'ALL' || patient.status === statusFilter;
      const matchesDate = matchesDateFilter(
        patient.createdAt,
        dateFilter,
        today,
      );

      return matchesStatus && matchesDate;
    });
  }, [dateFilter, patients, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }: { table: TableType<Patient> }) => (
          <input
            aria-label="Select all patients"
            checked={table.getIsAllRowsSelected()}
            className="form-check-input form-check-input-light fs-14"
            onChange={table.getToggleAllRowsSelectedHandler()}
            type="checkbox"
          />
        ),
        cell: ({ row }: { row: TableRow<Patient> }) => (
          <input
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
            checked={row.getIsSelected()}
            className="form-check-input form-check-input-light fs-14"
            onChange={row.getToggleSelectedHandler()}
            type="checkbox"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor(
        (patient) => `${patient.firstName} ${patient.lastName}`,
        {
          id: 'patient',
          header: 'Patient Name',
          cell: ({ row }) => {
            const patient = row.original;
            const fullName = `${patient.firstName} ${patient.lastName}`;

            return (
              <div className="d-flex align-items-center gap-2">
                <div className="avatar avatar-sm">
                  <Image
                    alt={fullName}
                    className="img-fluid rounded-circle"
                    height={32}
                    src={getPatientAvatar(patient.id)}
                    width={32}
                  />
                </div>
                <div>
                  <h5 className="mb-0 lh-base fs-base">
                    <button
                      className="link-reset border-0 bg-transparent p-0"
                      onClick={() => setViewedPatient(patient)}
                      type="button"
                    >
                      {fullName}
                    </button>
                  </h5>
                  <p className="text-muted fs-xs mb-0">
                    {patient.email ?? 'No email'}
                  </p>
                </div>
              </div>
            );
          },
        },
      ),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: ({ getValue }) => (
          <span className="badge p-1 text-bg-light fs-sm">
            {getValue() ? formatPatientEnum(getValue() as string) : 'Not set'}
          </span>
        ),
      }),
      columnHelper.accessor('dateOfBirth', {
        header: 'Date of Birth',
        cell: ({ getValue }) => formatPatientDate(getValue()),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Registered',
        cell: ({ getValue }) => formatPatientDate(getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => (
          <span className={`badge badge-label ${statusClassName[getValue()]}`}>
            {formatPatientEnum(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: TableRow<Patient> }) => {
          const patient = row.original;
          const fullName = `${patient.firstName} ${patient.lastName}`;

          return (
            <div className="d-flex align-items-center justify-content-center gap-1">
              <Button
                aria-label={`View ${fullName}`}
                className="btn-default btn-icon rounded-circle"
                onClick={() => setViewedPatient(patient)}
                size="sm"
                title="View patient"
              >
                <Icon icon="eye" className="fs-lg" />
              </Button>
              <Button
                aria-label={`Edit ${fullName}`}
                className="btn-default btn-icon rounded-circle"
                onClick={() => setEditedPatient(patient)}
                size="sm"
                title="Edit patient"
              >
                <Icon icon="square-pen" className="fs-lg" />
              </Button>
              <Button
                aria-label={`Delete ${fullName}`}
                className="btn-default btn-icon rounded-circle"
                onClick={() => {
                  setSelectedRowIds({ [patient.id]: true });
                  setShowDeleteModal(true);
                }}
                size="sm"
                title="Delete patient"
              >
                <Icon icon="trash-2" className="fs-lg" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: visiblePatients,
    columns,
    state: {
      globalFilter,
      pagination,
      rowSelection: selectedRowIds,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (patient) => patient.id,
    globalFilterFn: patientGlobalFilter,
    enableColumnFilters: true,
    enableRowSelection: true,
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalItems = table.getFilteredRowModel().rows.length;
  const start = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);
  const selectedCount = Object.keys(selectedRowIds).length;

  const resetPage = () => table.setPageIndex(0);

  const handleDelete = async () => {
    try {
      await Promise.all(
        Object.keys(selectedRowIds).map(async (patientId) => {
          const patient = patients.find((item) => item.id === patientId);
          if (!patient) return;

          await deletePatient({
            clinicId: patient.clinicId,
            patientId: patient.id,
          });
        }),
      );

      setSelectedRowIds({});
      setShowDeleteModal(false);
      resetPage();
    } catch (error) {
      showNotification({
        message: getErrorMessage(error),
        title: 'Patient request failed',
        variant: 'danger',
      });
    }
  };

  const handleUpdate = async (command: UpdatePatientCommand) => {
    try {
      await updatePatient(command);
      setEditedPatient(null);
    } catch (error) {
      showNotification({
        message: getErrorMessage(error),
        title: 'Patient request failed',
        variant: 'danger',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div className="d-flex gap-2">
          <div className="app-search">
            <input
              className="form-control"
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search patients..."
              type="text"
              value={globalFilter}
            />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>

          <Link className="btn btn-primary" href="/patients/new">
            <Icon icon="plus" className="me-1" />
            New Patient
          </Link>

          {selectedCount > 0 && (
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="me-2 fw-semibold">Filter By:</span>

          <div className="app-search">
            <FormSelect
              aria-label="Filter patients by registration date"
              className="form-control my-1 my-md-0"
              onChange={(event) => {
                setDateFilter(event.target.value as PatientDateFilter);
                resetPage();
              }}
              value={dateFilter}
            >
              <option value="ALL">Registration Date</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 days</option>
              <option value="LAST_30_DAYS">Last 30 days</option>
              <option value="OLDER_THAN_30_DAYS">Older than 30 days</option>
            </FormSelect>
            <Icon icon="calendar-days" className="app-search-icon text-muted" />
          </div>

          <div className="app-search">
            <FormSelect
              aria-label="Filter patients by status"
              className="form-control my-1 my-md-0"
              onChange={(event) => {
                setStatusFilter(event.target.value as PatientStatus | 'ALL');
                resetPage();
              }}
              value={statusFilter}
            >
              <option value="ALL">Patient Status</option>
              {PATIENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatPatientEnum(status)}
                </option>
              ))}
            </FormSelect>
            <Icon icon="shuffle" className="app-search-icon text-muted" />
          </div>

          <div>
            <FormSelect
              aria-label="Patients per page"
              className="form-control my-1 my-md-0"
              onChange={(event) =>
                table.setPageSize(Number(event.target.value))
              }
              value={pageSize}
            >
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </CardHeader>

      <DataTable<Patient> table={table} emptyMessage="No patients found." />

      {totalItems > 0 && (
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="patients"
            showInfo
            previousPage={table.previousPage}
            canPreviousPage={table.getCanPreviousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            setPageIndex={table.setPageIndex}
            nextPage={table.nextPage}
            canNextPage={table.getCanNextPage()}
          />
        </CardFooter>
      )}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        selectedCount={selectedCount}
        itemName="patient"
      />

      <PatientDetailsModal
        patient={viewedPatient}
        onHide={() => setViewedPatient(null)}
      />

      <PatientEditModal
        patient={editedPatient}
        onHide={() => setEditedPatient(null)}
        onSave={handleUpdate}
      />
    </Card>
  );
};

export default PatientTable;
