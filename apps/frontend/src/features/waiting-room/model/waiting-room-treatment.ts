import type { WaitingRoomEntry } from './waiting-room';
import { canLaunchTreatmentFromWaitingRoom } from './waiting-room.rules';

export interface WaitingRoomTreatmentContext {
  appointmentId: string;
  chairId: string;
  doctorId: string;
  patientId: string;
  queueEntryId: string;
}

export const getWaitingRoomTreatmentContext = (
  entry: WaitingRoomEntry,
): WaitingRoomTreatmentContext | null => {
  if (!canLaunchTreatmentFromWaitingRoom(entry) || !entry.chairId) {
    return null;
  }

  return {
    appointmentId: entry.appointmentId,
    chairId: entry.chairId,
    doctorId: entry.doctorId,
    patientId: entry.patientId,
    queueEntryId: entry.id,
  };
};

export const buildWaitingRoomTreatmentPath = (
  entry: WaitingRoomEntry,
): string | null => {
  const context = getWaitingRoomTreatmentContext(entry);
  if (!context) return null;

  const searchParams = new URLSearchParams([
    ['patientId', context.patientId],
    ['appointmentId', context.appointmentId],
    ['queueEntryId', context.queueEntryId],
    ['chairId', context.chairId],
    ['doctorId', context.doctorId],
  ]);

  return `/visits/new?${searchParams.toString()}`;
};
