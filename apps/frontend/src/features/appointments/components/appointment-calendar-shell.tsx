'use client';

import Icon from '@/components/wrappers/Icon';
import { SimpleBar } from '@/components/wrappers/SimpleBar';
import { useStaffMembers } from '@/features/staff';
import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';
import type {
  DatesSetArg,
  EventApi,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from '@fullcalendar/interaction/index.js';
import listPlugin from '@fullcalendar/list/index.js';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, CardBody, Spinner } from 'react-bootstrap';
import { useWindowSize } from 'usehooks-ts';

import { checkAppointmentConflicts } from '../api';
import {
  useAppointments,
  useCancelAppointment,
  useCreateAppointment,
  useRescheduleAppointment,
  useUpdateAppointment,
} from '../hooks';
import {
  APPOINTMENT_STATUSES,
  appointmentStatusCalendarClassNames,
  appointmentStatusDotClassNames,
  appointmentStatusLabels,
  executeAppointmentInlineReschedule,
  projectActiveDoctorProviders,
  toggleVisibleProviderId,
  type Appointment,
  type AppointmentProvider,
} from '../model';
import {
  calculateAppointmentFormEndAt,
  mapAppointmentFormToCreateCommand,
  mapAppointmentFormToUpdateCommand,
  parseAppointmentDateTimeLocalInputValue,
  validateAppointmentForm,
  type AppointmentFormValues,
} from '../schemas';
import AppointmentCancelModal from './appointment-cancel-modal';
import AppointmentEventPopover from './appointment-event-popover';
import AppointmentFormModal from './appointment-form-modal';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const defaultCalendarHeight = 650;
const calendarPage = 1;
const calendarPageLimit = 100;

interface CalendarRange {
  startDate: Date;
  endDate: Date;
}

interface AppointmentModalState {
  appointment: Appointment | null;
  initialStartAt: Date;
}

interface AppointmentPopoverState {
  appointment: Appointment;
  target: HTMLElement;
}

const conflictMessage =
  'This doctor already has an appointment during the selected time.';

const mapAppointmentSubmissionError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return conflictMessage;
    }

    return error.message || 'Unable to save the appointment.';
  }

  return error instanceof Error
    ? error.message
    : 'Unable to save the appointment.';
};

const mapAppointmentRescheduleError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return conflictMessage;
    }

    return error.message || 'Unable to reschedule the appointment.';
  }

  return error instanceof Error
    ? error.message
    : 'Unable to reschedule the appointment.';
};

const mapAppointmentCancellationError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message || 'Unable to cancel the appointment.';
  }

  return error instanceof Error
    ? error.message
    : 'Unable to cancel the appointment.';
};

const mapAppointmentToCalendarEvent = (
  appointment: Appointment,
): EventInput => ({
  id: appointment.id,
  title: [
    appointment.patientName,
    appointment.type ?? 'Appointment',
    appointment.doctorName,
  ].join(' - '),
  start: appointment.startAt,
  end: appointment.endAt,
  classNames: appointmentStatusCalendarClassNames[appointment.status].split(
    ' ',
  ),
  extendedProps: {
    appointment,
  },
});

const getAppointmentFromCalendarEvent = (
  event: EventApi,
): Appointment | null =>
  (event.extendedProps as { appointment?: Appointment }).appointment ?? null;

const AppointmentCalendarShell = () => {
  const { height } = useWindowSize();
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const { cancelAppointment, isPending: isCancellingAppointment } =
    useCancelAppointment();
  const { createAppointment, isPending: isCreatingAppointment } =
    useCreateAppointment();
  const { isPending: isReschedulingAppointment, rescheduleAppointment } =
    useRescheduleAppointment();
  const { isPending: isUpdatingAppointment, updateAppointment } =
    useUpdateAppointment();
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [calendarRange, setCalendarRange] = useState<CalendarRange | null>(
    null,
  );
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(
    null,
  );
  const [visibleProviderIds, setVisibleProviderIds] = useState<string[]>([]);
  const [appointmentModal, setAppointmentModal] =
    useState<AppointmentModalState | null>(null);
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);
  const [appointmentCancelModal, setAppointmentCancelModal] =
    useState<Appointment | null>(null);
  const [appointmentCancellationError, setAppointmentCancellationError] =
    useState<string | null>(null);
  const [appointmentSubmissionError, setAppointmentSubmissionError] = useState<
    string | null
  >(null);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

  const staffMembers = useStaffMembers(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );
  const providers = useMemo(
    () => projectActiveDoctorProviders(staffMembers.data ?? []),
    [staffMembers.data],
  );

  const appointmentsQuery = useMemo(
    () =>
      clinicId && calendarRange
        ? {
            clinicId,
            endDate: calendarRange.endDate,
            limit: calendarPageLimit,
            page: calendarPage,
            startDate: calendarRange.startDate,
          }
        : null,
    [calendarRange, clinicId],
  );
  const appointments = useAppointments(appointmentsQuery);
  const selectedProviderIds = useMemo(
    () => new Set(visibleProviderIds),
    [visibleProviderIds],
  );
  const filteredAppointments = useMemo(() => {
    if (providers.length === 0) return appointments.data?.appointments ?? [];

    return (appointments.data?.appointments ?? []).filter((appointment) =>
      selectedProviderIds.has(appointment.doctorId),
    );
  }, [appointments.data?.appointments, providers.length, selectedProviderIds]);
  const events = useMemo(
    () => filteredAppointments.map(mapAppointmentToCalendarEvent),
    [filteredAppointments],
  );
  const isInitialLoading =
    sessionStatus === 'loading' ||
    ((appointments.isLoading || staffMembers.isLoading) && events.length === 0);
  const isAppointmentSavePending =
    isSubmittingAppointment || isCreatingAppointment || isUpdatingAppointment;
  const defaultModalProvider = useMemo(() => {
    if (appointmentModal?.appointment) {
      return (
        providers.find(
          (provider) =>
            provider.doctorId === appointmentModal.appointment?.doctorId,
        ) ?? null
      );
    }

    return (
      providers.find((provider) => provider.doctorId === visibleProviderIds[0]) ??
      providers[0] ??
      null
    );
  }, [appointmentModal, providers, visibleProviderIds]);

  useEffect(() => {
    const providerIds = providers.map((provider) => provider.doctorId);

    if (providerIds.length === 0) {
      setVisibleProviderIds([]);
      return;
    }

    setVisibleProviderIds((currentIds) => {
      const nextIds = currentIds.filter((id) => providerIds.includes(id));

      return nextIds.length > 0 ? nextIds : providerIds;
    });
  }, [providers]);

  const calendarHeight = useMemo(() => {
    if (!height) return defaultCalendarHeight;

    return Math.max(520, height - 240);
  }, [height]);

  const handleCreateDraft = () => {
    setSelectedSlotLabel('New appointment draft');
    setAppointmentPopover(null);
    setAppointmentSubmissionError(null);
    setAppointmentModal({
      appointment: null,
      initialStartAt: new Date(),
    });
  };

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedSlotLabel(dateTimeFormatter.format(arg.date));
    setAppointmentPopover(null);
    setAppointmentSubmissionError(null);
    setAppointmentModal({
      appointment: null,
      initialStartAt: arg.date,
    });
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setAppointmentPopover(null);
    setCalendarRange({
      endDate: arg.end,
      startDate: arg.start,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();

    const appointment = getAppointmentFromCalendarEvent(arg.event);

    setSelectedSlotLabel(arg.event.title);

    if (!appointment) return;

    setAppointmentPopover({
      appointment,
      target: arg.el,
    });
  };

  const handleInlineReschedule = async ({
    appointment,
    newEndAt,
    newStartAt,
    revert,
  }: {
    appointment: Appointment;
    newEndAt: Date | null;
    newStartAt: Date | null;
    revert: () => void;
  }) => {
    setAppointmentPopover(null);

    try {
      const result = await executeAppointmentInlineReschedule({
        appointment,
        checkConflicts: checkAppointmentConflicts,
        newEndAt,
        newStartAt,
        rescheduleAppointment,
        revert,
      });

      if (result.status === 'invalid') {
        showNotification({
          message: 'Choose a valid appointment time.',
          title: 'Appointment not moved',
          variant: 'warning',
        });
        return;
      }

      if (result.status === 'conflict') {
        showNotification({
          message: conflictMessage,
          title: 'Appointment conflict',
          variant: 'warning',
        });
        return;
      }

      showNotification({
        message: 'Appointment rescheduled successfully.',
        title: 'Appointment rescheduled',
        variant: 'success',
      });

      if (result.command) {
        setSelectedSlotLabel(
          `${appointment.patientName} - ${dateTimeFormatter.format(
            result.command.newStartAt,
          )}`,
        );
      }
    } catch (error) {
      showNotification({
        message: mapAppointmentRescheduleError(error),
        title: 'Reschedule failed',
        variant: 'danger',
      });
    }
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const appointment = getAppointmentFromCalendarEvent(arg.event);

    if (!appointment) {
      arg.revert();
      return;
    }

    void handleInlineReschedule({
      appointment,
      newEndAt: arg.event.end,
      newStartAt: arg.event.start,
      revert: arg.revert,
    });
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const appointment = getAppointmentFromCalendarEvent(arg.event);

    if (!appointment) {
      arg.revert();
      return;
    }

    void handleInlineReschedule({
      appointment,
      newEndAt: arg.event.end,
      newStartAt: arg.event.start,
      revert: arg.revert,
    });
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentPopover(null);
    setAppointmentSubmissionError(null);
    setAppointmentModal({
      appointment,
      initialStartAt: appointment.startAt,
    });
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentPopover(null);
    setAppointmentCancellationError(null);
    setAppointmentCancelModal(appointment);
  };

  const handleAppointmentCancellationSubmit = async (
    cancellationReason: string,
  ) => {
    if (!appointmentCancelModal) return;

    try {
      setAppointmentCancellationError(null);
      await cancelAppointment({
        clinicId: appointmentCancelModal.clinicId,
        appointmentId: appointmentCancelModal.id,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason.trim() || null,
      });

      showNotification({
        message: 'Appointment cancelled successfully.',
        title: 'Appointment cancelled',
        variant: 'success',
      });
      setSelectedSlotLabel(
        `${appointmentCancelModal.patientName} - Cancelled`,
      );
      setAppointmentCancelModal(null);
    } catch (error) {
      const message = mapAppointmentCancellationError(error);
      setAppointmentCancellationError(message);
      showNotification({
        message,
        title: 'Cancellation failed',
        variant: 'danger',
      });
    }
  };

  const handleCheckInAppointment = (appointment: Appointment) => {
    setAppointmentPopover(null);
    showNotification({
      message: `${appointment.patientName} is ready for check-in details.`,
      title: 'Check-in action selected',
      variant: 'info',
    });
  };

  const handleAppointmentFormSubmit = async (values: AppointmentFormValues) => {
    const validation = validateAppointmentForm(values);
    if (!validation.isValid) {
      setAppointmentSubmissionError('Check the form and try again.');
      return;
    }

    const endAt = calculateAppointmentFormEndAt(values);
    const startAt = parseAppointmentDateTimeLocalInputValue(values.startAt);
    const patientName = values.patientName.trim() || 'Appointment';
    const appointment = appointmentModal?.appointment ?? null;
    const resolvedClinicId = appointment?.clinicId ?? clinicId;

    if (!resolvedClinicId || !startAt || !endAt) {
      setAppointmentSubmissionError('Appointment timing is invalid.');
      return;
    }

    try {
      setIsSubmittingAppointment(true);
      setAppointmentSubmissionError(null);

      if (!values.isEmergency) {
        const conflict = await checkAppointmentConflicts({
          clinicId: resolvedClinicId,
          doctorId: values.doctorId.trim(),
          startAt,
          endAt,
          excludeAppointmentId: appointment?.id,
        });

        if (conflict.hasConflict) {
          setAppointmentSubmissionError(conflictMessage);
          showNotification({
            message: conflictMessage,
            title: 'Appointment conflict',
            variant: 'warning',
          });
          return;
        }
      }

      if (appointment) {
        await updateAppointment(
          mapAppointmentFormToUpdateCommand(appointment, values),
        );
      } else {
        await createAppointment(
          mapAppointmentFormToCreateCommand(resolvedClinicId, values),
        );
      }

      showNotification({
        message: appointment
          ? 'Appointment updated successfully.'
          : 'Appointment created successfully.',
        title: appointment ? 'Appointment updated' : 'Appointment created',
        variant: 'success',
      });

      setSelectedSlotLabel(`${patientName} - ${dateTimeFormatter.format(endAt)}`);
      setAppointmentModal(null);
    } catch (error) {
      const message = mapAppointmentSubmissionError(error);
      setAppointmentSubmissionError(message);
      showNotification({
        message,
        title: 'Appointment request failed',
        variant: 'danger',
      });
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const handleProviderToggle = (providerId: string) => {
    setVisibleProviderIds((currentIds) =>
      toggleVisibleProviderId(currentIds, providerId),
    );
  };

  const renderProviderAvatar = (provider: AppointmentProvider) => {
    if (provider.avatar) {
      return (
        <img
          alt=""
          className="avatar-xs rounded-circle"
          src={provider.avatar}
        />
      );
    }

    return (
      <span
        aria-hidden="true"
        className={`avatar-xs rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold ${provider.colorClassName}`}
      >
        {provider.initials}
      </span>
    );
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

          <div className="border-top mt-4 pt-3">
            <h5 className="fs-sm text-uppercase text-muted mb-2">Visible</h5>
            <p className="mb-0 text-muted">
              {filteredAppointments.length} of {appointments.data?.total ?? 0}{' '}
              appointments
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

        {sessionStatus === 'authenticated' && !clinicId && (
          <Alert className="m-3 mb-0" variant="warning">
            This session is missing a clinic context. Appointments cannot be
            loaded.
          </Alert>
        )}

        {appointments.isError && (
          <Alert
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 m-3 mb-0"
            variant="danger"
          >
            <span>
              {appointments.error.message || 'Unable to load appointments.'}
            </span>
            <Button
              disabled={appointments.isFetching}
              onClick={() => {
                void appointments.refetch();
              }}
              size="sm"
              variant="outline-danger"
            >
              <Icon icon="refresh-cw" className="me-1" />
              Retry
            </Button>
          </Alert>
        )}

        {staffMembers.isError && (
          <Alert
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 m-3 mb-0"
            variant="warning"
          >
            <span>
              {staffMembers.error.message || 'Unable to load doctors.'}
            </span>
            <Button
              disabled={staffMembers.isFetching}
              onClick={() => {
                void staffMembers.refetch();
              }}
              size="sm"
              variant="outline-warning"
            >
              <Icon icon="refresh-cw" className="me-1" />
              Retry
            </Button>
          </Alert>
        )}

        {isInitialLoading && (
          <div className="d-flex align-items-center gap-2 px-3 pt-3 text-muted">
            <Spinner animation="border" size="sm" />
            <span>Loading appointments</span>
          </div>
        )}

        {providers.length > 0 && (
          <div className="px-3 pt-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              {providers.map((provider) => {
                const isVisible = visibleProviderIds.includes(
                  provider.doctorId,
                );

                return (
                  <Button
                    aria-pressed={isVisible}
                    className="rounded-pill d-inline-flex align-items-center gap-2 px-2"
                    key={provider.doctorId}
                    onClick={() => handleProviderToggle(provider.doctorId)}
                    size="sm"
                    variant={isVisible ? 'primary' : 'outline-secondary'}
                  >
                    {renderProviderAvatar(provider)}
                    <span>{provider.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {!staffMembers.isLoading &&
          !staffMembers.isError &&
          providers.length === 0 &&
          clinicId && (
            <Alert className="m-3 mb-0" variant="info">
              No active doctors are available for scheduling.
            </Alert>
          )}

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
            datesSet={handleDatesSet}
            editable={!isReschedulingAppointment}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventDurationEditable={!isReschedulingAppointment}
            eventResizableFromStart={true}
            eventResize={handleEventResize}
            eventStartEditable={!isReschedulingAppointment}
            events={events}
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

      {appointmentPopover && (
        <AppointmentEventPopover
          appointment={appointmentPopover.appointment}
          onCancel={handleCancelAppointment}
          onCheckIn={handleCheckInAppointment}
          onEdit={handleEditAppointment}
          onHide={() => setAppointmentPopover(null)}
          show={true}
          target={appointmentPopover.target}
        />
      )}

      {appointmentCancelModal && (
        <AppointmentCancelModal
          appointment={appointmentCancelModal}
          error={appointmentCancellationError}
          isSubmitting={isCancellingAppointment}
          onHide={() => {
            if (isCancellingAppointment) return;

            setAppointmentCancellationError(null);
            setAppointmentCancelModal(null);
          }}
          onSubmit={handleAppointmentCancellationSubmit}
          show={true}
        />
      )}

      {appointmentModal && (
        <AppointmentFormModal
          appointment={appointmentModal.appointment}
          defaultProvider={defaultModalProvider}
          initialStartAt={appointmentModal.initialStartAt}
          isSubmitting={isAppointmentSavePending}
          onHide={() => setAppointmentModal(null)}
          onSubmit={handleAppointmentFormSubmit}
          onValuesChange={() => setAppointmentSubmissionError(null)}
          providers={providers}
          show={true}
          submissionError={appointmentSubmissionError}
        />
      )}
    </div>
  );
};

export default AppointmentCalendarShell;
