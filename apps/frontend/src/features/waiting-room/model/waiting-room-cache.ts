import {
  QUEUE_STATUSES,
  type WaitingRoomChair,
  type WaitingRoomEntry,
  type WaitingRoomQueueStreamEvent,
  type WaitingRoomState,
} from './waiting-room';

const upsertById = <TItem extends { id: string }>(
  items: TItem[],
  item: TItem,
): TItem[] => {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index === -1) return [...items, item];

  return items.map((candidate, candidateIndex) =>
    candidateIndex === index ? item : candidate,
  );
};

const mergeEntries = (
  entries: WaitingRoomEntry[],
  event: WaitingRoomQueueStreamEvent,
): WaitingRoomEntry[] => {
  if (event.type === 'queue.reordered' && event.entries) {
    const reorderedIds = new Set(event.entries.map((entry) => entry.id));
    const preserved = entries.filter((entry) => {
      if (reorderedIds.has(entry.id)) return false;
      if (event.status && entry.status === event.status) return false;

      return true;
    });

    return [...preserved, ...event.entries];
  }

  if (event.entry) {
    return upsertById(entries, event.entry);
  }

  return entries;
};

const mergeChair = (
  chairs: WaitingRoomChair[],
  event: WaitingRoomQueueStreamEvent,
): WaitingRoomChair[] =>
  event.chair ? upsertById(chairs, event.chair) : chairs;

export const applyWaitingRoomEventToState = (
  state: WaitingRoomState | undefined,
  event: WaitingRoomQueueStreamEvent,
): WaitingRoomState | undefined => {
  if (
    !state ||
    state.entries.some((entry) => entry.clinicId !== event.clinicId)
  ) {
    return state;
  }

  const entries = mergeEntries(state.entries, event);

  return {
    ...state,
    entries,
    chairs: mergeChair(state.chairs, event),
    ordering: {
      mode: entries.some((entry) => entry.manualOrder !== null)
        ? 'MANUAL'
        : 'AUTO',
      manualStatuses: QUEUE_STATUSES.filter((status) =>
        entries.some(
          (entry) => entry.status === status && entry.manualOrder !== null,
        ),
      ),
    },
  };
};

export const applyWaitingRoomEventToChairs = (
  chairs: WaitingRoomChair[] | undefined,
  event: WaitingRoomQueueStreamEvent,
): WaitingRoomChair[] | undefined => {
  if (!chairs || !event.chair || event.chair.clinicId !== event.clinicId) {
    return chairs;
  }

  return upsertById(chairs, event.chair);
};
