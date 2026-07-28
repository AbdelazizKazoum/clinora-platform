'use client';

import {
  archivePatient as archivePatientCommand,
  createPatient as createPatientCommand,
  deletePatient as deletePatientCommand,
  restorePatient as restorePatientCommand,
  updatePatient as updatePatientCommand,
} from '@/features/patients/api';
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
  createPatient: (command: CreatePatientCommand) => Promise<void>;
  updatePatient: (command: UpdatePatientCommand) => Promise<void>;
  archivePatient: (command: ArchivePatientCommand) => Promise<void>;
  restorePatient: (command: RestorePatientCommand) => Promise<void>;
  deletePatient: (command: DeletePatientCommand) => Promise<void>;
  resetPatients: () => void;
}

export type PatientStore = PatientState & PatientActions;

const createInitialPatients = (): Patient[] =>
  MOCK_PATIENTS.map((patient) => ({ ...patient }));

export const usePatientStore = create<PatientStore>((set) => ({
  patients: createInitialPatients(),

  createPatient: async (command) => {
    const patient = await createPatientCommand(command);

    set((state) => ({ patients: [patient, ...state.patients] }));
  },

  updatePatient: async (command) => {
    const updatedPatient = await updatePatientCommand(command);

    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === updatedPatient.id &&
        patient.clinicId === updatedPatient.clinicId
          ? updatedPatient
          : patient,
      ),
    }));
  },

  archivePatient: async ({ clinicId, patientId }) => {
    await archivePatientCommand({ clinicId, patientId });

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

  restorePatient: async (command) => {
    const restoredPatient = await restorePatientCommand(command);

    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === restoredPatient.id &&
        patient.clinicId === restoredPatient.clinicId
          ? restoredPatient
          : patient,
      ),
    }));
  },

  deletePatient: async ({ clinicId, patientId }) => {
    await deletePatientCommand({ clinicId, patientId });

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
