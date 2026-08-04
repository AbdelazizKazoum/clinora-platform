'use client';

import Icon from '@/components/wrappers/Icon';
import { usePatientSearch, type Patient } from '@/features/patients';
import { useId, useState, type KeyboardEvent } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useDebounceValue } from 'usehooks-ts';

const patientSearchMinimumLength = 2;
const patientSearchDebounceMilliseconds = 300;

interface AppointmentPatientSelection {
  patientId: string;
  patientName: string;
  patientPhone: string;
}

interface AppointmentPatientSearchProps {
  clinicId: string | null | undefined;
  disabled?: boolean;
  error?: string;
  onChange: (selection: AppointmentPatientSelection) => void;
  patientId: string;
  patientName: string;
}

const getPatientName = (patient: Patient): string =>
  `${patient.firstName} ${patient.lastName}`.trim();

const getPatientInitials = (patient: Patient): string =>
  [patient.firstName, patient.lastName]
    .map((name) => name.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

const getPatientContact = (patient: Patient): string =>
  [patient.phone, patient.email].filter(Boolean).join(' · ') ||
  'No contact information';

const AppointmentPatientSearch = ({
  clinicId,
  disabled = false,
  error,
  onChange,
  patientId,
  patientName,
}: AppointmentPatientSearchProps) => {
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(patientName);
  const [debouncedSearchTerm] = useDebounceValue(
    searchTerm,
    patientSearchDebounceMilliseconds,
  );
  const patientSearch = usePatientSearch(
    isOpen ? clinicId : null,
    debouncedSearchTerm,
  );
  const patients = patientSearch.data ?? [];
  const normalizedSearchTerm = searchTerm.trim();
  const normalizedDebouncedSearchTerm = debouncedSearchTerm.trim();
  const hasSearchTerm =
    normalizedSearchTerm.length >= patientSearchMinimumLength;
  const isWaitingForResults =
    normalizedSearchTerm !== normalizedDebouncedSearchTerm ||
    patientSearch.isFetching;
  const showMenu = isOpen && hasSearchTerm;
  const activePatient = activeIndex >= 0 ? patients[activeIndex] : undefined;

  const selectPatient = (patient: Patient) => {
    const name = getPatientName(patient);

    setSearchTerm(name);
    setActiveIndex(-1);
    setIsOpen(false);
    onChange({
      patientId: patient.id,
      patientName: name,
      patientPhone: patient.phone ?? '',
    });
  };

  const handleSearchChange = (nextSearchTerm: string) => {
    setSearchTerm(nextSearchTerm);
    setActiveIndex(-1);
    setIsOpen(true);
    onChange({
      patientId: '',
      patientName: nextSearchTerm,
      patientPhone: '',
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setActiveIndex(-1);
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' && activePatient) {
      event.preventDefault();
      selectPatient(activePatient);
      return;
    }

    if (!hasSearchTerm || patients.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex >= patients.length - 1 ? 0 : currentIndex + 1,
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? patients.length - 1 : currentIndex - 1,
      );
    }
  };

  return (
    <Form.Group controlId="appointment-patient-search">
      <Form.Label>Patient</Form.Label>
      <div className="appointment-patient-search position-relative">
        <Icon
          className="appointment-patient-search-icon text-muted"
          icon="search"
        />
        <Form.Control
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={showMenu ? listboxId : undefined}
          aria-expanded={showMenu}
          autoComplete="off"
          className="appointment-patient-search-input"
          disabled={disabled || !clinicId}
          isInvalid={Boolean(error)}
          onBlur={() => {
            setActiveIndex(-1);
            setIsOpen(false);
          }}
          onChange={(event) => handleSearchChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name, phone, or email"
          role="combobox"
          value={searchTerm}
        />
        {isWaitingForResults && showMenu && (
          <Spinner
            animation="border"
            className="appointment-patient-search-spinner text-primary"
            size="sm"
          />
        )}

        {showMenu && (
          <div
            className="appointment-patient-search-menu rounded border bg-body shadow"
            id={listboxId}
          >
            {isWaitingForResults && (
              <div
                className="appointment-patient-search-message text-muted"
                role="status"
              >
                Searching patients…
              </div>
            )}

            {!isWaitingForResults && patientSearch.isError && (
              <div
                className="appointment-patient-search-message text-danger"
                role="alert"
              >
                Unable to search patients. Please try again.
              </div>
            )}

            {!isWaitingForResults &&
              patientSearch.isSuccess &&
              patients.length === 0 && (
                <div
                  className="appointment-patient-search-message text-muted"
                  role="status"
                >
                  No matching active patients found.
                </div>
              )}

            {!isWaitingForResults && patients.length > 0 && (
              <div aria-label="Matching patients" role="listbox">
                {patients.map((patient, index) => {
                  const isActive = index === activeIndex;
                  const isSelected = patient.id === patientId;

                  return (
                    <button
                      aria-selected={isSelected}
                      className={`appointment-patient-search-option dropdown-item d-flex align-items-center gap-2${
                        isActive ? ' active' : ''
                      }`}
                      id={`${listboxId}-option-${index}`}
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      onMouseDown={(event) => event.preventDefault()}
                      role="option"
                      type="button"
                    >
                      <span className="avatar-sm flex-shrink-0">
                        <span className="avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold">
                          {getPatientInitials(patient)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-grow-1">
                        <span className="d-block text-truncate fw-semibold">
                          {getPatientName(patient)}
                        </span>
                        <small className="appointment-patient-search-contact d-block text-muted text-truncate">
                          {getPatientContact(patient)}
                        </small>
                      </span>
                      {isSelected && (
                        <Icon className="flex-shrink-0" icon="check" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Form.Text className="text-muted">
        Enter at least two characters, then choose an existing patient.
      </Form.Text>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </Form.Group>
  );
};

export default AppointmentPatientSearch;
