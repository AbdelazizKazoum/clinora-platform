import {ConflictException} from "@nestjs/common";
import {ManageAppointmentsUseCase} from "./manage-appointments.use-case";
import {Appointment} from "../../domain/entities/appointment";
import {AppointmentStatus} from "../../domain/enums/appointment-status.enum";
import {BookingChannel} from "../../domain/enums/booking-channel.enum";

describe("ManageAppointmentsUseCase", () => {
  const now = new Date("2026-05-11T09:00:00.000Z");
  const later = new Date("2026-05-11T09:30:00.000Z");

  function makeAppointment(isEmergency = false): Appointment {
    return new Appointment(
      "appointment-1",
      "clinic-1",
      "patient-1",
      "Patient One",
      "555",
      "doctor-1",
      "Doctor One",
      now,
      later,
      isEmergency,
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

  function setup(hasConflict: boolean) {
    const created = makeAppointment();
    const appointments = {
      create: jest.fn().mockResolvedValue(created),
      findById: jest.fn().mockResolvedValue(created),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue(created),
      checkConflicts: jest.fn().mockResolvedValue(hasConflict),
    };
    const outbox = {
      add: jest.fn().mockResolvedValue(undefined),
      findUnpublished: jest.fn(),
      markPublished: jest.fn(),
    };
    const patients = {
      getPatient: jest.fn().mockResolvedValue({
        id: "patient-1",
        clinicId: "clinic-1",
        firstName: "Patient",
        lastName: "One",
      }),
    };
    const clinic = {
      getStaffMember: jest.fn().mockResolvedValue({
        userId: "doctor-1",
        clinicId: "clinic-1",
        role: "DOCTOR",
        firstName: "Doctor",
        lastName: "One",
      }),
    };

    return {
      useCase: new ManageAppointmentsUseCase(
        appointments,
        outbox,
        patients,
        clinic,
      ),
      appointments,
    };
  }

  it("blocks routine appointment creation when the doctor has an overlap", async () => {
    const {useCase} = setup(true);

    await expect(
      useCase.create({
        clinicId: "clinic-1",
        patientId: "patient-1",
        patientName: "Patient One",
        doctorId: "doctor-1",
        doctorName: "Doctor One",
        startAt: now,
        endAt: later,
        isEmergency: false,
        channel: BookingChannel.PHONE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("allows emergency appointment creation even when the doctor has an overlap", async () => {
    const {useCase, appointments} = setup(true);

    await expect(
      useCase.create({
        clinicId: "clinic-1",
        patientId: "patient-1",
        patientName: "Patient One",
        doctorId: "doctor-1",
        doctorName: "Doctor One",
        startAt: now,
        endAt: later,
        isEmergency: true,
        channel: BookingChannel.PHONE,
      }),
    ).resolves.toEqual(makeAppointment());

    expect(appointments.create).toHaveBeenCalled();
  });

  it("checks conflicts when moving a non-emergency appointment", async () => {
    const {useCase} = setup(true);

    await expect(
      useCase.updateTiming({
        appointmentId: "appointment-1",
        doctorId: "doctor-1",
        newStartAt: now,
        newEndAt: later,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
