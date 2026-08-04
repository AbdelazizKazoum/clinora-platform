import { render, screen } from '@testing-library/react';

import AppointmentScheduleSkeleton, {
  getCalendarSkeletonView,
  type CalendarSkeletonView,
} from './appointment-schedule-skeleton';

describe('AppointmentScheduleSkeleton', () => {
  it.each([
    ['dayGridMonth', 'month'],
    ['timeGridWeek', 'week'],
    ['timeGridDay', 'day'],
    ['listMonth', 'list'],
    ['listWeek', 'list'],
  ] satisfies [string, CalendarSkeletonView][])(
    'maps %s to %s',
    (view, result) => {
      expect(getCalendarSkeletonView(view)).toBe(result);
    },
  );

  it.each([
    ['week', 7],
    ['day', 1],
  ] satisfies [CalendarSkeletonView, number][])(
    'renders an isolated %s time grid with %i day lanes',
    (view, laneCount) => {
      const { container } = render(
        <AppointmentScheduleSkeleton
          height={650}
          isCompact={false}
          view={view}
        />,
      );

      expect(
        screen.getByRole('status', { name: `Loading ${view} calendar` }),
      ).toBeTruthy();
      expect(
        container.querySelectorAll('.appointment-schedule-skeleton-time-lane'),
      ).toHaveLength(laneCount);
      expect(
        container.querySelector('.appointment-schedule-skeleton-month'),
      ).toBeNull();
      expect(
        container.querySelector('.appointment-schedule-skeleton-list'),
      ).toBeNull();
    },
  );
});
