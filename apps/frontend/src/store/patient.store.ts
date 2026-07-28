'use client';

import { MOCK_PATIENTS } from '@/features/patients/mocks/patients.mock';
import type {
  ArchivePatientCommand,
  CreatePatientCommand,
  DeletePatientCommand,
  Patient,
  RestorePatientCommand,
  UpdatePatientCommand,
} from '@/features/patients/model';
import { create } from 'zustand';

interface PatientState {
  patients: Patient[];
}

interface PatientActions {
  createPatient: (command: CreatePatientCommand) => void;
  updatePatient: (command: UpdatePatientCommand) => void;
  archivePatient: (command: ArchivePatientCommand) => void;
  restorePatient: (command: RestorePatientCommand) => void;
  deletePatient: (command: DeletePatientCommand) => void;
  resetPatients: () => void;
}

export type PatientStore = PatientState & PatientActions;

const createInitialPatients = (): Patient[] =>
  MOCK_PATIENTS.map((patient) => ({ ...patient }));

export const usePatientStore = create<PatientStore>((set) => ({
  patients: createInitialPatients(),

  createPatient: (command) => {
    const now = new Date();
    const patient: Patient = {
      id: globalThis.crypto.randomUUID(),
      clinicId: command.clinicId,
      userId: command.userId ?? null,
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone ?? null,
      email: command.email ?? null,
      dateOfBirth: command.dateOfBirth ?? null,
      gender: command.gender ?? null,
      address: command.address ?? null,
      notes: command.notes ?? null,
      allergies: command.allergies ?? null,
      chronicConditions: command.chronicConditions ?? null,
      currentMedications: command.currentMedications ?? null,
      medicalNotes: command.medicalNotes ?? null,
      status: command.status ?? 'ACTIVE',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ patients: [patient, ...state.patients] }));
  },

  updatePatient: (command) => {
    set((state) => ({
      patients: state.patients.map((patient) => {
        if (
          patient.id !== command.patientId ||
          patient.clinicId !== command.clinicId
        ) {
          return patient;
        }

        return {
          ...patient,
          ...(command.firstName !== undefined && {
            firstName: command.firstName,
          }),
          ...(command.lastName !== undefined && {
            lastName: command.lastName,
          }),
          ...(command.phone !== undefined && { phone: command.phone }),
          ...(command.email !== undefined && { email: command.email }),
          ...(command.dateOfBirth !== undefined && {
            dateOfBirth: command.dateOfBirth,
          }),
          ...(command.gender !== undefined && { gender: command.gender }),
          ...(command.address !== undefined && { address: command.address }),
          ...(command.notes !== undefined && { notes: command.notes }),
          ...(command.allergies !== undefined && {
            allergies: command.allergies,
          }),
          ...(command.chronicConditions !== undefined && {
            chronicConditions: command.chronicConditions,
          }),
          ...(command.currentMedications !== undefined && {
            currentMedications: command.currentMedications,
          }),
          ...(command.medicalNotes !== undefined && {
            medicalNotes: command.medicalNotes,
          }),
          ...(command.status !== undefined && { status: command.status }),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  archivePatient: ({ clinicId, patientId }) => {
    const now = new Date();

    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === patientId && patient.clinicId === clinicId
          ? {
              ...patient,
              status: 'ARCHIVED',
              deletedAt: now,
              updatedAt: now,
            }
          : patient,
      ),
    }));
  },

  restorePatient: ({ clinicId, patientId }) => {
    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === patientId && patient.clinicId === clinicId
          ? {
              ...patient,
              status: 'ACTIVE',
              deletedAt: null,
              updatedAt: new Date(),
            }
          : patient,
      ),
    }));
  },

  deletePatient: ({ clinicId, patientId }) => {
    set((state) => ({
      patients: state.patients.filter(
        (patient) => patient.id !== patientId || patient.clinicId !== clinicId,
      ),
    }));
  },

  resetPatients: () => {
    set({ patients: createInitialPatients() });
  },
}));
