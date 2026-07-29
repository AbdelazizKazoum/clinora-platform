import user1 from '@/assets/images/users/user-1.jpg';
import user2 from '@/assets/images/users/user-2.jpg';
import user3 from '@/assets/images/users/user-3.jpg';
import user4 from '@/assets/images/users/user-4.jpg';
import user5 from '@/assets/images/users/user-5.jpg';
import user6 from '@/assets/images/users/user-6.jpg';
import Icon from '@/components/wrappers/Icon';
import {
  createColumnHelper,
  type Row as TableRow,
  type Table as TableType,
} from '@tanstack/react-table';
import Image, { type StaticImageData } from 'next/image';
import { Button } from 'react-bootstrap';
import type { Patient, PatientStatus } from '../../model';
import {
  formatPatientDate,
  formatPatientEnum,
} from '../../utils/patient-display';

interface CreatePatientTableColumnsOptions {
  onArchive: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onView: (patient: Patient) => void;
}

const columnHelper = createColumnHelper<Patient>();
const patientAvatars = [user1, user2, user3, user4, user5, user6];

const statusClassName: Record<PatientStatus, string> = {
  ACTIVE: 'bg-success-subtle text-success',
  INACTIVE: 'bg-warning-subtle text-warning',
  ARCHIVED: 'bg-secondary-subtle text-secondary',
};

const getPatientAvatar = (patientId: string): StaticImageData => {
  const hash = Array.from(patientId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return patientAvatars[hash % patientAvatars.length];
};

export const createPatientTableColumns = ({
  onArchive,
  onEdit,
  onView,
}: CreatePatientTableColumnsOptions) => [
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
                onClick={() => onView(patient)}
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
            onClick={() => onView(patient)}
            size="sm"
            title="View patient"
          >
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button
            aria-label={`Edit ${fullName}`}
            className="btn-default btn-icon rounded-circle"
            onClick={() => onEdit(patient)}
            size="sm"
            title="Edit patient"
          >
            <Icon icon="square-pen" className="fs-lg" />
          </Button>
          <Button
            aria-label={`Delete ${fullName}`}
            className="btn-default btn-icon rounded-circle"
            onClick={() => onArchive(patient)}
            size="sm"
            title="Delete patient"
          >
            <Icon icon="trash-2" className="fs-lg" />
          </Button>
        </div>
      );
    },
  }),
];
