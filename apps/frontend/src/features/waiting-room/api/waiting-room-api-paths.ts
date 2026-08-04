const encodePathPart = (value: string): string => encodeURIComponent(value);

export const waitingRoomApiPaths = {
  state: (clinicId: string): string =>
    `/clinics/${encodePathPart(clinicId)}/waiting-room`,
  entryStatus: (clinicId: string, entryId: string): string =>
    `${waitingRoomApiPaths.state(clinicId)}/entries/${encodePathPart(
      entryId,
    )}/status`,
  entryNotes: (clinicId: string, entryId: string): string =>
    `${waitingRoomApiPaths.state(clinicId)}/entries/${encodePathPart(
      entryId,
    )}/notes`,
  entryChair: (clinicId: string, entryId: string): string =>
    `${waitingRoomApiPaths.state(clinicId)}/entries/${encodePathPart(
      entryId,
    )}/chair`,
  reorder: (clinicId: string): string =>
    `${waitingRoomApiPaths.state(clinicId)}/reorder`,
  chairs: (clinicId: string): string =>
    `${waitingRoomApiPaths.state(clinicId)}/chairs`,
  chair: (clinicId: string, chairId: string): string =>
    `${waitingRoomApiPaths.chairs(clinicId)}/${encodePathPart(chairId)}`,
  queueEvents: (clinicId: string): string =>
    `/events/queue?clinicId=${encodePathPart(clinicId)}`,
};
