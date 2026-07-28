'use client';

import DataTable from '@/components/table/DataTable';
import TablePagination from '@/components/table/TablePagination';
import Icon from '@/components/wrappers/Icon';
import { usePatientStore } from '@/store';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  FormSelect,
} from 'react-bootstrap';
import { PATIENT_STATUSES, type Patient, type PatientStatus } from '../model';

const columnHelper = createColumnHelper<Patient>();

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const statusVariant: Record<PatientStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'secondary',
};

const PatientTable = () => {
  const patients = usePatientStore((state) => state.patients);
  const archivePatient = usePatientStore((state) => state.archivePatient);
  const restorePatient = usePatientStore((state) => state.restorePatient);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>(
    'ALL',
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });

  const visiblePatients = useMemo(
    () =>
      statusFilter === 'ALL'
        ? patients
        : patients.filter((patient) => patient.status === statusFilter),
    [patients, statusFilter],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (patient) => `${patient.firstName} ${patient.lastName}`,
        {
          id: 'patient',
          header: 'Patient',
          cell: ({ row }) => (
            <div>
              <h5 className="mb-1 fs-base">
                {row.original.firstName} {row.original.lastName}
              </h5>
              <span className="text-muted fs-xs">
                {row.original.email ?? 'No email'}
              </span>
            </div>
          ),
        },
      ),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: ({ getValue }) => {
          const gender = getValue();
          return gender
            ? gender.charAt(0) + gender.slice(1).toLowerCase()
            : '—';
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Registered',
        cell: ({ getValue }) => dateFormatter.format(getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge bg={statusVariant[getValue()]}>{getValue()}</Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const patient = row.original;

          return patient.status === 'ARCHIVED' ? (
            <Button
              aria-label={`Restore ${patient.firstName} ${patient.lastName}`}
              onClick={() =>
                restorePatient({
                  clinicId: patient.clinicId,
                  patientId: patient.id,
                })
              }
              size="sm"
              title="Restore patient"
              variant="soft-success"
            >
              <Icon icon="rotate-ccw" />
            </Button>
          ) : (
            <Button
              aria-label={`Archive ${patient.firstName} ${patient.lastName}`}
              onClick={() =>
                archivePatient({
                  clinicId: patient.clinicId,
                  patientId: patient.id,
                })
              }
              size="sm"
              title="Archive patient"
              variant="soft-secondary"
            >
              <Icon icon="archive" />
            </Button>
          );
        },
      }),
    ],
    [archivePatient, restorePatient],
  );

  const table = useReactTable({
    data: visiblePatients,
    columns,
    state: { globalFilter, pagination, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalItems = table.getFilteredRowModel().rows.length;
  const start = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as PatientStatus | 'ALL');
    table.setPageIndex(0);
  };

  return (
    <Card>
      <CardHeader className="border-light d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="app-search">
            <input
              className="form-control"
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search patients..."
              type="search"
              value={globalFilter}
            />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>

          <FormSelect
            aria-label="Filter patients by status"
            className="w-auto"
            onChange={(event) => handleStatusChange(event.target.value)}
            value={statusFilter}
          >
            <option value="ALL">All statuses</option>
            {PATIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </FormSelect>
        </div>

        <Link className="btn btn-primary" href="/patients/new">
          <Icon icon="plus" className="me-1" />
          Add patient
        </Link>
      </CardHeader>

      <DataTable table={table} emptyMessage="No patients found." />

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
    </Card>
  );
};

export default PatientTable;
