const patientDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const formatPatientDate = (date: Date | null): string =>
  date ? patientDateFormatter.format(date) : '—';

export const formatPatientEnum = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase();
