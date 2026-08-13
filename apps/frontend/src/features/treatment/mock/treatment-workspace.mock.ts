import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisit } from '../model/treatment';

const createdAt = new Date('2026-08-13T09:30:00.000Z');

export const MOCK_DENTIST: MockTreatmentActor = {
  name: 'Dr. Sara Benali',
  role: 'doctor',
  userId: 'doctor-demo',
};

export const MOCK_ASSISTANT: MockTreatmentActor = {
  name: 'Yasmine Alaoui',
  role: 'dental_assistant',
  userId: 'assistant-demo',
};

export interface MockTreatmentPatient {
  readonly id: string;
  readonly name: string;
  readonly dateOfBirth: string;
  readonly sex: string;
  readonly allergies: readonly string[];
  readonly alerts: readonly string[];
}

export const MOCK_TREATMENT_PATIENT: MockTreatmentPatient = {
  alerts: ['Anticoagulant therapy'],
  allergies: ['Penicillin'],
  dateOfBirth: '1988-04-17',
  id: 'patient-demo',
  name: 'Omar El Mansouri',
  sex: 'Male',
};

export const createMockTreatmentVisit = (
  launch?: Partial<{
    appointmentId: string;
    chairId: string;
    doctorId: string;
    patientId: string;
    queueEntryId: string;
  }>,
): TreatmentVisit => ({
  acts: [
    {
      approvedByDentistId: MOCK_DENTIST.userId,
      code: 'ROOT_CANAL_FILLING',
      createdAt,
      details: [],
      enteredByUserId: MOCK_DENTIST.userId,
      id: 'act-demo-root-canal-36',
      note: 'Existing endodontic plan from today’s assessment.',
      performedByUserId: null,
      status: 'PLANNED',
      target: {
        arch: null,
        kind: 'TOOTH',
        periodontalSites: [],
        surfaces: [],
        toothNumbers: [36],
      },
      updatedAt: createdAt,
    },
  ],
  appointmentId: launch?.appointmentId ?? 'appointment-demo',
  cancelledAt: null,
  cancellationReason: null,
  chairId: launch?.chairId ?? 'chair-02',
  chiefComplaint: 'Pain on chewing in the upper-right posterior region.',
  clinicId: 'clinic-demo',
  clinicalNotes: 'Mock clinical workspace — changes are not persisted.',
  completedAt: null,
  createdAt,
  documentationHandoff: null,
  findings: [
    {
      code: 'CARIES',
      createdAt,
      details: [{ key: 'ICDAS_CARS_SEVERITY', value: 4 }],
      enteredByUserId: MOCK_DENTIST.userId,
      id: 'finding-demo-caries-16',
      note: 'Distinct dentine shadow; confirm radiographically.',
      status: 'CONFIRMED',
      target: {
        arch: null,
        kind: 'TOOTH_SURFACE',
        periodontalSites: [],
        surfaces: ['OCCLUSAL'],
        toothNumbers: [16],
      },
      updatedAt: createdAt,
      verifiedByUserId: MOCK_DENTIST.userId,
    },
    {
      code: 'EXISTING_FILLING',
      createdAt,
      details: [{ key: 'FILLING_MATERIAL', value: 'AMALGAM' }],
      enteredByUserId: MOCK_DENTIST.userId,
      id: 'finding-demo-filling-26',
      note: null,
      status: 'CONFIRMED',
      target: {
        arch: null,
        kind: 'TOOTH_SURFACE',
        periodontalSites: [],
        surfaces: ['OCCLUSAL'],
        toothNumbers: [26],
      },
      updatedAt: createdAt,
      verifiedByUserId: MOCK_DENTIST.userId,
    },
    {
      code: 'TOOTH_STATE',
      createdAt,
      details: [{ key: 'TOOTH_STATE', value: 'MISSING' }],
      enteredByUserId: MOCK_DENTIST.userId,
      id: 'finding-demo-missing-46',
      note: 'Previously extracted.',
      status: 'CONFIRMED',
      target: {
        arch: null,
        kind: 'TOOTH',
        periodontalSites: [],
        surfaces: [],
        toothNumbers: [46],
      },
      updatedAt: createdAt,
      verifiedByUserId: MOCK_DENTIST.userId,
    },
  ],
  id: 'visit-demo',
  patientId: launch?.patientId ?? MOCK_TREATMENT_PATIENT.id,
  queueEntryId: launch?.queueEntryId ?? 'queue-demo',
  responsibleDentistId: launch?.doctorId ?? MOCK_DENTIST.userId,
  startedAt: createdAt,
  status: 'IN_PROGRESS',
  updatedAt: createdAt,
});
