import Icon from '@/components/wrappers/Icon';
import { Button, CardHeader, FormSelect } from 'react-bootstrap';
import { PATIENT_STATUSES, type PatientStatus } from '../../model';
import { formatPatientEnum } from '../../utils/patient-display';
import type { PatientDateFilter } from './patient-table.types';

interface PatientTableToolbarProps {
  dateFilter: PatientDateFilter;
  globalFilter: string;
  onArchiveSelected: () => void;
  onDateFilterChange: (filter: PatientDateFilter) => void;
  onNewPatient: () => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: PatientStatus | 'ALL') => void;
  pageSize: number;
  selectedCount: number;
  statusFilter: PatientStatus | 'ALL';
}

const PatientTableToolbar = ({
  dateFilter,
  globalFilter,
  onArchiveSelected,
  onDateFilterChange,
  onNewPatient,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  pageSize,
  selectedCount,
  statusFilter,
}: PatientTableToolbarProps) => (
  <CardHeader className="border-light justify-content-between">
    <div className="d-flex gap-2">
      <div className="app-search">
        <input
          className="form-control"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search patients..."
          type="text"
          value={globalFilter}
        />
        <Icon icon="search" className="app-search-icon text-muted" />
      </div>

      <Button onClick={onNewPatient} variant="primary">
        <Icon icon="plus" className="me-1" />
        New Patient
      </Button>

      {selectedCount > 0 && (
        <Button variant="danger" onClick={onArchiveSelected}>
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
          onChange={(event) =>
            onDateFilterChange(event.target.value as PatientDateFilter)
          }
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
          onChange={(event) =>
            onStatusFilterChange(event.target.value as PatientStatus | 'ALL')
          }
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
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
);

export default PatientTableToolbar;
