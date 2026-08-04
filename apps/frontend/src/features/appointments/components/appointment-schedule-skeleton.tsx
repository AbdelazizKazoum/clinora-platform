import type { CSSProperties } from 'react';

export type CalendarSkeletonView = 'day' | 'list' | 'month' | 'week';

export const getCalendarSkeletonView = (
  viewType: string,
): CalendarSkeletonView => {
  if (viewType.startsWith('timeGridDay')) return 'day';
  if (viewType.startsWith('timeGridWeek')) return 'week';
  if (viewType.startsWith('list')) return 'list';

  return 'month';
};

const AppointmentSkeletonBar = ({ className = '' }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`placeholder appointment-schedule-skeleton-bar ${className}`.trim()}
  />
);

const AppointmentScheduleSkeleton = ({
  height,
  isCompact,
  view,
}: {
  height: number;
  isCompact: boolean;
  view: CalendarSkeletonView;
}) => {
  const timeGridColumns = view === 'day' ? 1 : 7;
  const toolbarViews = isCompact ? 2 : 4;

  return (
    <div
      aria-label={`Loading ${view} calendar`}
      aria-live="polite"
      className={`appointment-schedule-skeleton appointment-schedule-skeleton-${view} placeholder-glow p-3`}
      role="status"
      style={{ minHeight: height }}
    >
      <span className="visually-hidden">Loading calendar appointments</span>
      <div
        aria-hidden="true"
        className="appointment-schedule-skeleton-toolbar mb-3"
      >
        <div className="appointment-schedule-skeleton-actions">
          <AppointmentSkeletonBar className="appointment-schedule-skeleton-button appointment-schedule-skeleton-button-icon" />
          <AppointmentSkeletonBar className="appointment-schedule-skeleton-button appointment-schedule-skeleton-button-icon" />
          {!isCompact && (
            <AppointmentSkeletonBar className="appointment-schedule-skeleton-button appointment-schedule-skeleton-button-today" />
          )}
        </div>
        <AppointmentSkeletonBar className="appointment-schedule-skeleton-title" />
        <div className="appointment-schedule-skeleton-actions">
          {isCompact && (
            <AppointmentSkeletonBar className="appointment-schedule-skeleton-button appointment-schedule-skeleton-button-today" />
          )}
          {Array.from({ length: toolbarViews }, (_, index) => (
            <AppointmentSkeletonBar
              className={`appointment-schedule-skeleton-button appointment-schedule-skeleton-button-view ${
                (view === 'month' && index === 0) ||
                (view === 'week' && index === 1) ||
                (view === 'day' && index === toolbarViews - 2) ||
                (view === 'list' && index === toolbarViews - 1)
                  ? 'appointment-schedule-skeleton-button-active'
                  : ''
              }`}
              key={index}
            />
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="appointment-schedule-skeleton-month rounded border">
          <div className="appointment-schedule-skeleton-month-weekdays">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                className="appointment-schedule-skeleton-weekday border-end"
                key={`weekday-${index}`}
              >
                <AppointmentSkeletonBar />
              </span>
            ))}
          </div>
          <div className="appointment-schedule-skeleton-month-days">
            {Array.from({ length: 42 }, (_, index) => (
              <span
                className="appointment-schedule-skeleton-date border-end border-top"
                key={`date-${index}`}
              >
                <AppointmentSkeletonBar className="appointment-schedule-skeleton-date-number" />
                {index % 5 === 1 && (
                  <AppointmentSkeletonBar className="appointment-schedule-skeleton-month-event" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {(view === 'week' || view === 'day') && (
        <div
          className="appointment-schedule-skeleton-time-grid rounded border"
          style={
            { '--calendar-skeleton-columns': timeGridColumns } as CSSProperties
          }
        >
          <div className="appointment-schedule-skeleton-time-header">
            <span className="appointment-schedule-skeleton-time-corner border-end" />
            {Array.from({ length: timeGridColumns }, (_, index) => (
              <span
                className="appointment-schedule-skeleton-time-heading border-end"
                key={`heading-${index}`}
              >
                <AppointmentSkeletonBar />
              </span>
            ))}
          </div>
          <div className="appointment-schedule-skeleton-time-body">
            <div className="appointment-schedule-skeleton-time-axis border-end">
              {Array.from({ length: 10 }, (_, index) => (
                <span
                  className="appointment-schedule-skeleton-time-label border-top"
                  key={`time-${index}`}
                >
                  <AppointmentSkeletonBar />
                </span>
              ))}
            </div>
            {Array.from({ length: timeGridColumns }, (_, columnIndex) => (
              <div
                className="appointment-schedule-skeleton-time-lane border-end"
                key={`lane-${columnIndex}`}
              >
                {(view === 'day' || columnIndex % 3 === 1) && (
                  <span
                    className="appointment-schedule-skeleton-time-event"
                    style={{
                      height: view === 'day' ? 76 : 62,
                      top: 34 + ((columnIndex * 79) % 310),
                    }}
                  >
                    <AppointmentSkeletonBar />
                    <AppointmentSkeletonBar />
                  </span>
                )}
                {view === 'day' && (
                  <span
                    className="appointment-schedule-skeleton-time-event appointment-schedule-skeleton-time-event-secondary"
                    style={{ height: 58, top: 286 }}
                  >
                    <AppointmentSkeletonBar />
                    <AppointmentSkeletonBar />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="appointment-schedule-skeleton-list rounded border">
          <div className="appointment-schedule-skeleton-list-heading border-bottom">
            <AppointmentSkeletonBar />
            <AppointmentSkeletonBar />
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="appointment-schedule-skeleton-list-row border-bottom"
              key={index}
            >
              <AppointmentSkeletonBar className="appointment-schedule-skeleton-list-dot" />
              <AppointmentSkeletonBar className="appointment-schedule-skeleton-list-time" />
              <AppointmentSkeletonBar className="appointment-schedule-skeleton-list-title" />
              <AppointmentSkeletonBar className="appointment-schedule-skeleton-list-meta" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduleSkeleton;
