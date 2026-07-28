'use client';

import {
  archivePatient as archivePatientCommand,
  createPatient as createPatientCommand,
  deletePatient as deletePatientCommand,
  listPatients,
  restorePatient as restorePatientCommand,
  updatePatient as updatePatientCommand,
} from '@/features/patients/api';
import type {
  ArchivePatientCommand,
  CreatePatientCommand,
  DeletePatientCommand,
  ListPatientsQuery,
  Patient,
  PatientPageMeta,
  RestorePatientCommand,
  UpdatePatientCommand,
} from '@/features/patients/model';
import { create } from 'zustand';

interface PatientState {
  error: string | null;
  isLoading: boolean;
  meta: PatientPageMeta;
  patients: Patient[];
}

interface PatientActions {
  loadPatients: (query: ListPatientsQuery) => Promise<void>;
  createPatient: (command: CreatePatientCommand) => Promise<void>;
  updatePatient: (command: UpdatePatientCommand) => Promise<void>;
  archivePatient: (command: ArchivePatientCommand) => Promise<void>;
  restorePatient: (command: RestorePatientCommand) => Promise<void>;
  deletePatient: (command: DeletePatientCommand) => Promise<void>;
  resetPatients: () => void;
}

export type PatientStore = PatientState & PatientActions;

export const usePatientStore = create<PatientStore>((set) => ({
  error: null,
  isLoading: false,
  meta: {
    limit: 8,
    page: 1,
    total: 0,
    totalPages: 0,
  },
  patients: [],

  loadPatients: async (query) => {
    set({ error: null, isLoading: true });

    try {
      const result = await listPatients(query);
      set({ meta: result.meta, patients: result.patients });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load patients.';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

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

    set((state) => ({
      patients: state.patients.filter(
        (patient) => patient.id !== patientId || patient.clinicId !== clinicId,
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
    set({
      error: null,
      meta: {
        limit: 8,
        page: 1,
        total: 0,
        totalPages: 0,
      },
      patients: [],
    });
  },
}));
