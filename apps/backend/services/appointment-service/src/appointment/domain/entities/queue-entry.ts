import {QueuePriority} from "../enums/queue-priority.enum";
import {QueueStatus} from "../enums/queue-status.enum";

export class QueueEntry {
  constructor(
    public readonly id: string,
    public readonly clinicId: string,
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly patientName: string,
    public readonly patientPhone: string | null,
    public readonly doctorId: string,
    public readonly doctorName: string,
    public readonly appointmentType: string | null,
    public readonly status: QueueStatus,
    public readonly priority: QueuePriority,
    public readonly notes: string | null,
    public readonly arrivedAt: Date,
    public readonly calledAt: Date | null,
    public readonly seatedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly updatedAt: Date,
  ) {}
}
