import {BadRequestException, ConflictException} from "@nestjs/common";
import {ManageQueueUseCase} from "./manage-queue.use-case";
import {Appointment} from "../../domain/entities/appointment";
import {QueueEntry} from "../../domain/entities/queue-entry";
import {AppointmentStatus} from "../../domain/enums/appointment-status.enum";
import {BookingChannel} from "../../domain/enums/booking-channel.enum";
import {QueuePriority} from "../../domain/enums/queue-priority.enum";
import {QueueStatus} from "../../domain/enums/queue-status.enum";

describe("ManageQueueUseCase", () => {
  const now = new Date("2026-05-11T09:00:00.000Z");

  function appointment(): Appointment {
    return new Appointment(
      "appointment-1",
      "clinic-1",
      "patient-1",
      "Patient One",
      null,
      "doctor-1",
      "Doctor One",
      now,
      new Date("2026-05-11T09:30:00.000Z"),
      false,
      "Checkup",
      BookingChannel.PHONE,
      AppointmentStatus.CONFIRMED,
      null,
      null,
      null,
      "user-1",
      now,
      now,
    );
  }

  function queueEntry(status = QueueStatus.ARRIVED): QueueEntry {
    return new QueueEntry(
      "queue-1",
      "clinic-1",
      "appointment-1",
      "patient-1",
      "Patient One",
      null,
      "doctor-1",
      "Doctor One",
      "Checkup",
      status,
      QueuePriority.NORMAL,
      null,
      now,
      status === QueueStatus.WAITING ? now : null,
      status === QueueStatus.IN_CHAIR ? now : null,
      status === QueueStatus.DONE ? now : null,
      now,
    );
  }

  function setup() {
    const queue = {
      create: jest.fn().mockResolvedValue(queueEntry()),
      findById: jest.fn().mockResolvedValue(queueEntry()),
      findByAppointmentId: jest.fn(),
      listByClinic: jest.fn(),
      updateStatus: jest.fn().mockImplementation((_id, status, reason) => {
        if (status === QueueStatus.ARRIVED && !reason) {
          throw new BadRequestException(
            "Correction reason is required when reverting queue status",
          );
        }
        return Promise.resolve(queueEntry(status));
      }),
      updateNotes: jest.fn(),
    };
    const appointments = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(appointment()),
      findMany: jest.fn(),
      update: jest.fn(),
      checkConflicts: jest.fn(),
    };
    const outbox = {
      add: jest.fn().mockResolvedValue(undefined),
      findUnpublished: jest.fn(),
      markPublished: jest.fn(),
    };

    return {
      useCase: new ManageQueueUseCase(queue, appointments, outbox),
      queue,
      outbox,
    };
  }

  it("rejects duplicate appointment check-ins", async () => {
    const {useCase, queue} = setup();
    queue.create.mockRejectedValueOnce(
      new ConflictException("Appointment is already checked in"),
    );

    await expect(
      useCase.checkIn({
        clinicId: "clinic-1",
        appointmentId: "appointment-1",
        patientId: "patient-1",
        patientName: "Patient One",
        doctorId: "doctor-1",
        doctorName: "Doctor One",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("requires a reason before reverting queue status", async () => {
    const {useCase} = setup();

    await expect(
      useCase.updateStatus("queue-1", QueueStatus.ARRIVED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns entries with transition status timestamps from the repository", async () => {
    const {useCase} = setup();

    const updated = await useCase.updateStatus("queue-1", QueueStatus.WAITING);

    expect(updated.status).toBe(QueueStatus.WAITING);
    expect(updated.calledAt).toEqual(now);
  });

  it("publishes a complete queue event payload after check-in", async () => {
    const {useCase, outbox} = setup();

    await useCase.checkIn({
      clinicId: "clinic-1",
      appointmentId: "appointment-1",
      patientId: "patient-1",
      patientName: "Patient One",
      doctorId: "doctor-1",
      doctorName: "Doctor One",
    });

    expect(outbox.add).toHaveBeenCalledWith({
      eventType: "queue.checked_in",
      payload: expect.objectContaining({
        id: "queue-1",
        clinic_id: "clinic-1",
        appointment_id: "appointment-1",
        patient_id: "patient-1",
        patient_name: "Patient One",
        doctor_id: "doctor-1",
        doctor_name: "Doctor One",
        appointment_type: "Checkup",
        status: QueueStatus.ARRIVED,
        priority: QueuePriority.NORMAL,
        arrived_at: now.toISOString(),
      }),
    });
  });
});
