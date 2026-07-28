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
  type Row as TableRow,
  type SortingState,
  type Table as TableType,
  useReactTable,
} from '@tanstack/react-table';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  FormSelect,
  Placeholder,
  Table,
} from 'react-bootstrap';
import {
  PATIENT_STATUSES,
  type Patient,
  type PatientSortField,
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

const getPatientAvatar = (patientId: string): StaticImageData => {
  const hash = Array.from(patientId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return patientAvatars[hash % patientAvatars.length];
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);

  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
};

const getDateFilterRange = (
  filter: PatientDateFilter,
): { createdFrom?: Date; createdTo?: Date } => {
  if (filter === 'ALL') return {};

  const today = startOfDay(new Date());

  switch (filter) {
    case 'TODAY':
      return { createdFrom: today, createdTo: endOfDay(today) };
    case 'LAST_7_DAYS':
      return { createdFrom: addDays(today, -6), createdTo: endOfDay(today) };
    case 'LAST_30_DAYS':
      return { createdFrom: addDays(today, -29), createdTo: endOfDay(today) };
    case 'OLDER_THAN_30_DAYS':
      return { createdTo: endOfDay(addDays(today, -30)) };
  }
};

const SERVER_SORT_FIELDS = new Set<PatientSortField>([
  'firstName',
  'lastName',
  'createdAt',
  'updatedAt',
]);

const getServerSort = (
  sorting: SortingState,
): { sortBy: PatientSortField; sortOrder: 'asc' | 'desc' } => {
  const sort = sorting[0];

  if (sort && SERVER_SORT_FIELDS.has(sort.id as PatientSortField)) {
    return {
      sortBy: sort.id as PatientSortField,
      sortOrder: sort.desc ? 'desc' : 'asc',
    };
  }

  return { sortBy: 'createdAt', sortOrder: 'desc' };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to update patients.';

const PatientTableSkeleton = () => (
  <div className="table-responsive">
    <Table
      responsive
      hover
      className="table table-custom table-centered table-select w-100 mb-0"
      aria-hidden="true"
    >
      <thead className="bg-light align-middle bg-opacity-25 thead-sm">
        <tr className="text-uppercase fs-xxs">
          <th>
            <Placeholder className="col-5" />
          </th>
          <th>
            <Placeholder className="col-7" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
          <th>
            <Placeholder className="col-8" />
          </th>
          <th>
            <Placeholder className="col-7" />
          </th>
          <th>
            <Placeholder className="col-5" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
        </tr>
      </thead>
      <tbody className="placeholder-glow">
        {Array.from({ length: 8 }, (_, index) => (
          <tr key={index}>
            <td>
              <Placeholder className="col-4" />
            </td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <Placeholder
                  className="rounded-circle"
                  style={{ height: 32, width: 32 }}
                />
                <div className="w-100">
                  <Placeholder className="col-7 d-block mb-1" />
                  <Placeholder size="xs" className="col-9" />
                </div>
              </div>
            </td>
            <td>
              <Placeholder className="col-8" />
            </td>
            <td>
              <Placeholder className="col-5" />
            </td>
            <td>
              <Placeholder className="col-7" />
            </td>
            <td>
              <Placeholder className="col-7" />
            </td>
            <td>
              <Placeholder className="col-6" />
            </td>
            <td>
              <Placeholder className="col-8" />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

const PatientTable = () => {
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const error = usePatientStore((state) => state.error);
  const isLoading = usePatientStore((state) => state.isLoading);
  const loadPatients = usePatientStore((state) => state.loadPatients);
  const meta = usePatientStore((state) => state.meta);
  const patients = usePatientStore((state) => state.patients);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const archivePatient = usePatientStore((state) => state.archivePatient);
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
  const lastQueryKeyRef = useRef<string | null>(null);
  const isInitialLoading =
    sessionStatus === 'loading' || (isLoading && patients.length === 0);

  const patientListQuery = useMemo(() => {
    if (!clinicId) return null;

    const { sortBy, sortOrder } = getServerSort(sorting);
    const search = globalFilter.trim();

    return {
      clinicId,
      limit: pagination.pageSize,
      page: pagination.pageIndex + 1,
      search: search || undefined,
      sortBy,
      sortOrder,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      ...getDateFilterRange(dateFilter),
    };
  }, [
    clinicId,
    dateFilter,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    statusFilter,
  ]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !patientListQuery) return;

    const queryKey = JSON.stringify(patientListQuery);
    if (lastQueryKeyRef.current === queryKey) return;

    lastQueryKeyRef.current = queryKey;

    loadPatients(patientListQuery).catch((loadError: unknown) => {
      lastQueryKeyRef.current = null;
      showNotification({
        message: getErrorMessage(loadError),
        title: 'Unable to load patients',
        variant: 'danger',
      });
    });
  }, [loadPatients, patientListQuery, sessionStatus, showNotification]);

  useEffect(() => {
    setSelectedRowIds({});
  }, [patientListQuery]);

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
      columnHelper.accessor('lastName', {
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
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        enableSorting: false,
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="badge p-1 text-bg-light fs-sm">
            {getValue() ? formatPatientEnum(getValue() as string) : 'Not set'}
          </span>
        ),
      }),
      columnHelper.accessor('dateOfBirth', {
        header: 'Date of Birth',
        enableSorting: false,
        cell: ({ getValue }) => formatPatientDate(getValue()),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Registered',
        cell: ({ getValue }) => formatPatientDate(getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        enableSorting: false,
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
    data: patients,
    columns,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: meta.totalPages,
    state: {
      globalFilter,
      pagination,
      rowSelection: selectedRowIds,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    onSortingChange: (updater) => {
      setSorting((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      );
      resetPage();
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (patient) => patient.id,
    enableColumnFilters: true,
    enableRowSelection: true,
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalItems = meta.total;
  const start = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(start + patients.length - 1, totalItems);
  const selectedCount = Object.keys(selectedRowIds).length;

  const resetPage = () =>
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));

  const refreshCurrentPage = async () => {
    if (!patientListQuery) return;

    lastQueryKeyRef.current = null;
    await loadPatients(patientListQuery);
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        Object.keys(selectedRowIds).map(async (patientId) => {
          const patient = patients.find((item) => item.id === patientId);
          if (!patient) return;

          await archivePatient({
            clinicId: patient.clinicId,
            patientId: patient.id,
          });
        }),
      );

      setSelectedRowIds({});
      setShowDeleteModal(false);
      await refreshCurrentPage();
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
      await refreshCurrentPage();
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
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                resetPage();
              }}
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
              Archive
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
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                })
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

      {isInitialLoading ? (
        <PatientTableSkeleton />
      ) : (
        <DataTable<Patient>
          table={table}
          emptyMessage={error ?? 'No patients found.'}
        />
      )}

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
        confirmLabel="Archive"
        itemName="patient"
        title="Confirm archive"
      >
        {selectedCount > 1
          ? `Are you sure you want to archive these ${selectedCount} patients?`
          : 'Are you sure you want to archive this patient?'}
      </DeleteConfirmationModal>

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
