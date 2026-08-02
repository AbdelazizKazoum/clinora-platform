import PageBreadcrumb from '@/components/PageBreadcrumb';

import AppointmentCalendarShell from './appointment-calendar-shell';

const AppointmentSchedulePage = () => {
  return (
    <>
      <PageBreadcrumb title="Schedule" subtitle="Clinical" />
      <AppointmentCalendarShell />
    </>
  );
};

export default AppointmentSchedulePage;
