import { fireEvent, render, screen } from '@testing-library/react';

import { usePatientSearch, type Patient } from '@/features/patients';

import AppointmentPatientSearch from './appointment-patient-search';

jest.mock('@/components/wrappers/Icon', () => ({
  __esModule: true,
  default: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));

jest.mock('@/features/patients', () => ({
  usePatientSearch: jest.fn(),
}));

jest.mock('usehooks-ts', () => ({
  useDebounceValue: (value: string) => [value, jest.fn()],
}));

const patient: Patient = {
  address: null,
  allergies: null,
  chronicConditions: null,
  clinicId: 'clinic-a',
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  currentMedications: null,
  dateOfBirth: null,
  deletedAt: null,
  email: 'sara@example.com',
  firstName: 'Sara',
  gender: null,
  id: 'patient-1',
  lastName: 'Amrani',
  medicalNotes: null,
  notes: null,
  phone: '+212600000000',
  status: 'ACTIVE',
  updatedAt: new Date('2026-08-01T10:00:00.000Z'),
  userId: null,
};

describe('AppointmentPatientSearch', () => {
  beforeEach(() => {
    jest.mocked(usePatientSearch).mockReset();
    jest.mocked(usePatientSearch).mockReturnValue({
      data: [patient],
      isError: false,
      isFetching: false,
      isSuccess: true,
    } as never);
  });

  it('clears stale patient data while typing and fills it on selection', () => {
    const onChange = jest.fn();

    render(
      <AppointmentPatientSearch
        clinicId="clinic-a"
        onChange={onChange}
        patientId=""
        patientName=""
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Sara' } });

    expect(onChange).toHaveBeenLastCalledWith({
      patientId: '',
      patientName: 'Sara',
      patientPhone: '',
    });
    expect(usePatientSearch).toHaveBeenLastCalledWith('clinic-a', 'Sara');

    fireEvent.click(screen.getByRole('option'));

    expect(onChange).toHaveBeenLastCalledWith({
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: '+212600000000',
    });
  });
});
