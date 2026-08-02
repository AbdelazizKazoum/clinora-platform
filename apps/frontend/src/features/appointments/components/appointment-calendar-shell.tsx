'use client';

import Icon from '@/components/wrappers/Icon';
import { SimpleBar } from '@/components/wrappers/SimpleBar';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin, {
  type DateClickArg,
} from '@fullcalendar/interaction/index.js';
import listPlugin from '@fullcalendar/list/index.js';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import { useMemo, useState } from 'react';
import { Button, Card, CardBody } from 'react-bootstrap';
import { useWindowSize } from 'usehooks-ts';

import {
  APPOINTMENT_STATUSES,
  appointmentStatusDotClassNames,
  appointmentStatusLabels,
} from '../model';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const defaultCalendarHeight = 650;

const AppointmentCalendarShell = () => {
  const { height } = useWindowSize();
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(
    null,
  );

  const calendarHeight = useMemo(() => {
    if (!height) return defaultCalendarHeight;

    return Math.max(520, height - 240);
  }, [height]);

  const handleCreateDraft = () => {
    setSelectedSlotLabel('New appointment draft');
  };

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedSlotLabel(dateTimeFormatter.format(arg.date));
  };

  return (
    <div className="outlook-box gap-1">
      <Card className="h-100 mb-0 d-none d-lg-flex rounded-end-0 overflow-y-auto outlook-left-menu outlook-left-menu-sm">
        <CardBody>
          <Button
            className="w-100 btn-new-event"
            onClick={handleCreateDraft}
            variant="primary"
          >
            <Icon icon="plus" className="me-2 align-middle" />
            New Appointment
          </Button>

          <div className="mt-4">
            <h5 className="fs-sm text-uppercase text-muted mb-2">Status</h5>
            <div className="d-grid gap-2">
              {APPOINTMENT_STATUSES.map((status) => (
                <div
                  className="d-flex align-items-center justify-content-between gap-2"
                  key={status}
                >
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`rounded-circle ${appointmentStatusDotClassNames[status]}`}
                      style={{ height: 8, width: 8 }}
                    />
                    <span className="fw-medium">
                      {appointmentStatusLabels[status]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-top mt-4 pt-3">
            <h5 className="fs-sm text-uppercase text-muted mb-2">Selection</h5>
            <p className="mb-0 text-muted">
              {selectedSlotLabel ?? 'No slot selected'}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="h-100 mb-0 rounded-start-0 flex-grow-1 border-start-0">
        <div className="d-lg-none d-flex flex-wrap align-items-center justify-content-between gap-2 card-header">
          <Button
            className="btn-new-event"
            onClick={handleCreateDraft}
            variant="primary"
          >
            <Icon icon="plus" className="me-2 align-middle" />
            New Appointment
          </Button>

          <span className="text-muted fs-sm">
            {selectedSlotLabel ?? 'No slot selected'}
          </span>
        </div>

        <SimpleBar className="card-body">
          <FullCalendar
            bootstrapFontAwesome={false}
            buttonText={{
              day: 'Day',
              list: 'List',
              month: 'Month',
              next: 'Next',
              prev: 'Prev',
              today: 'Today',
              week: 'Week',
            }}
            dateClick={handleDateClick}
            editable={false}
            events={[]}
            handleWindowResize={true}
            headerToolbar={{
              center: 'title',
              left: 'prev,next today',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            }}
            height={calendarHeight}
            initialView="dayGridMonth"
            plugins={[
              dayGridPlugin,
              interactionPlugin,
              timeGridPlugin,
              listPlugin,
            ]}
            selectable={true}
            slotDuration="00:30:00"
            slotMaxTime="19:00:00"
            slotMinTime="07:00:00"
          />
        </SimpleBar>
      </Card>
    </div>
  );
};

export default AppointmentCalendarShell;
