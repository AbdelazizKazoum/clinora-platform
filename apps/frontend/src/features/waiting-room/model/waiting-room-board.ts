import type {
  QueuePriority,
  QueueStatus,
  WaitingRoomEntry,
} from './waiting-room';

export type WaitingRoomPriorityFilter = QueuePriority | 'ALL';

export interface WaitingRoomBoardFilters {
  doctorId: string | 'ALL';
  priority: WaitingRoomPriorityFilter;
  search: string;
}

export interface WaitingRoomDoctorOption {
  id: string;
  name: string;
}

export type WaitingRoomSummary = Record<QueueStatus, number>;

const normalizeSearchValue = (value: string): string =>
  value.trim().toLocaleLowerCase();

export const filterWaitingRoomEntries = (
  entries: WaitingRoomEntry[],
  filters: WaitingRoomBoardFilters,
): WaitingRoomEntry[] => {
  const search = normalizeSearchValue(filters.search);

  return entries.filter((entry) => {
    if (filters.priority !== 'ALL' && entry.priority !== filters.priority) {
      return false;
    }

    if (filters.doctorId !== 'ALL' && entry.doctorId !== filters.doctorId) {
      return false;
    }

    if (!search) return true;

    return normalizeSearchValue(
      [
        entry.patientName,
        entry.patientPhone,
        entry.doctorName,
        entry.appointmentType,
        entry.queueNotes,
        entry.chairName,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' '),
    ).includes(search);
  });
};

export const groupWaitingRoomEntriesByStatus = (
  entries: WaitingRoomEntry[],
): Record<QueueStatus, WaitingRoomEntry[]> => {
  const groupedEntries: Record<QueueStatus, WaitingRoomEntry[]> = {
    ARRIVED: [],
    WAITING: [],
    IN_CHAIR: [],
    DONE: [],
  };

  entries.forEach((entry) => {
    groupedEntries[entry.status].push(entry);
  });

  return groupedEntries;
};

export const getWaitingRoomSummary = (
  entries: WaitingRoomEntry[],
): WaitingRoomSummary => {
  const summary: WaitingRoomSummary = {
    ARRIVED: 0,
    WAITING: 0,
    IN_CHAIR: 0,
    DONE: 0,
  };

  entries.forEach((entry) => {
    summary[entry.status] += 1;
  });

  return summary;
};

export const getWaitingRoomDoctorOptions = (
  entries: WaitingRoomEntry[],
): WaitingRoomDoctorOption[] =>
  Array.from(
    new Map(
      entries.map((entry) => [
        entry.doctorId,
        { id: entry.doctorId, name: entry.doctorName },
      ]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

export const getWaitingRoomPatientInitials = (patientName: string): string => {
  const initials = patientName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? '')
    .join('');

  return initials || '?';
};
