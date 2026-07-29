'use client';

import DataTable from '@/components/table/DataTable';
import DeleteConfirmationModal from '@/components/table/delete-confirmation-modal';
import TablePagination from '@/components/table/TablePagination';
import { useNotificationStore, usePatientStore } from '@/store';
import {
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardFooter } from 'react-bootstrap';
import type { Patient, PatientSortField, PatientStatus } from '../model';
import PatientDetailsModal from './patient-details-modal';
import PatientIntakeModal from './patient-intake/patient-intake-modal';
import { createPatientTableColumns } from './patient-table/patient-table-columns';
import PatientTableSkeleton from './patient-table/patient-table-skeleton';
import PatientTableToolbar from './patient-table/patient-table-toolbar';
import type { PatientDateFilter } from './patient-table/patient-table.types';

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

const PatientTable = () => {
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const error = usePatientStore((state) => state.error);
  const isLoading = usePatientStore((state) => state.isLoading);
  const loadPatients = usePatientStore((state) => state.loadPatients);
  const meta = usePatientStore((state) => state.meta);
  const patients = usePatientStore((state) => state.patients);
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
  const [intakePatient, setIntakePatient] = useState<Patient | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
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
    () =>
      createPatientTableColumns({
        onArchive: (patient) => {
          setSelectedRowIds({ [patient.id]: true });
          setShowDeleteModal(true);
        },
        onEdit: (patient) => {
          setIntakePatient(patient);
          setShowIntakeModal(true);
        },
        onView: setViewedPatient,
      }),
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

  const handleHideIntakeModal = () => {
    setShowIntakeModal(false);
    setIntakePatient(null);
  };

  return (
    <Card>
      <PatientTableToolbar
        dateFilter={dateFilter}
        globalFilter={globalFilter}
        onArchiveSelected={() => setShowDeleteModal(true)}
        onDateFilterChange={(filter) => {
          setDateFilter(filter);
          resetPage();
        }}
        onNewPatient={() => {
          setIntakePatient(null);
          setShowIntakeModal(true);
        }}
        onPageSizeChange={(newPageSize) =>
          setPagination({
            pageIndex: 0,
            pageSize: newPageSize,
          })
        }
        onSearchChange={(search) => {
          setGlobalFilter(search);
          resetPage();
        }}
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          resetPage();
        }}
        pageSize={pageSize}
        selectedCount={selectedCount}
        statusFilter={statusFilter}
      />

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

      <PatientIntakeModal
        patient={intakePatient}
        show={showIntakeModal}
        onHide={handleHideIntakeModal}
        onSaved={refreshCurrentPage}
      />
    </Card>
  );
};

export default PatientTable;
