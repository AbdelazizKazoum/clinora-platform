import { createMockTreatmentVisit } from '../mock/treatment-workspace.mock';
import { mapTreatmentVisitToOdontogram } from './treatment-odontogram.mapper';
import {
  approveWorkspacePeriodontalExamination,
  approveWorkspaceAct,
  assignWorkspaceDocumentation,
  completeWorkspaceVisit,
  recordWorkspaceAct,
  reviewWorkspaceDocumentation,
  startWorkspaceDocumentation,
  submitWorkspaceDocumentation,
  transitionWorkspaceAct,
  updateWorkspacePeriodontalExamination,
  type MockTreatmentActor,
} from './treatment-workspace';
import { updatePeriodontalSite } from './periodontal';

const now = new Date('2026-08-13T12:00:00.000Z');
const dentist: MockTreatmentActor = {
  name: 'Dr. Sara Benali',
  role: 'doctor',
  userId: 'doctor-demo',
};
const assistant: MockTreatmentActor = {
  name: 'Yasmine Alaoui',
  role: 'dental_assistant',
  userId: 'assistant-demo',
};

const fillingInput = {
  code: 'DIRECT_FILLING' as const,
  details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }] as const,
  id: 'act-assistant-draft',
  target: {
    arch: null,
    kind: 'TOOTH_SURFACE' as const,
    periodontalSites: [],
    surfaces: ['OCCLUSAL' as const],
    toothNumbers: [16],
  },
};

describe('Mock Treatment workspace workflow', () => {
  it('requires an active assignment before an assistant can document', () => {
    expect(() =>
      recordWorkspaceAct(
        createMockTreatmentVisit(),
        assistant,
        fillingInput,
        now,
      ),
    ).toThrow('An active assistant assignment is required.');
  });

  it('keeps assistant entries as drafts until the responsible dentist approves', () => {
    const assigned = assignWorkspaceDocumentation(
      createMockTreatmentVisit(),
      dentist,
      assistant.userId,
      'handoff-1',
      now,
    );
    const started = startWorkspaceDocumentation(assigned, assistant, now);
    const documented = recordWorkspaceAct(
      started,
      assistant,
      fillingInput,
      now,
    );

    expect(documented.acts.at(-1)).toMatchObject({
      approvedByDentistId: null,
      enteredByUserId: assistant.userId,
      status: 'DRAFT',
    });
    expect(
      mapTreatmentVisitToOdontogram(documented)
        .data.teeth.find(({ position }) => position === 16)
        ?.conditions.some(({ kind }) => kind === 'filling'),
    ).toBe(false);

    const approved = approveWorkspaceAct(
      documented,
      dentist,
      fillingInput.id,
      now,
    );
    expect(approved.acts.at(-1)).toMatchObject({
      approvedByDentistId: dentist.userId,
      status: 'PLANNED',
    });
    expect(
      mapTreatmentVisitToOdontogram(approved)
        .data.teeth.find(({ position }) => position === 16)
        ?.conditions.some(({ kind }) => kind === 'filling'),
    ).toBe(true);
  });

  it('moves the handoff through assistant submission and dentist acceptance', () => {
    const assigned = assignWorkspaceDocumentation(
      createMockTreatmentVisit(),
      dentist,
      assistant.userId,
      'handoff-1',
      now,
    );
    const started = startWorkspaceDocumentation(assigned, assistant, now);
    const submitted = submitWorkspaceDocumentation(started, assistant, now);
    const accepted = reviewWorkspaceDocumentation(
      submitted,
      dentist,
      'ACCEPT',
      now,
    );
    const completed = completeWorkspaceVisit(accepted, dentist, now);

    expect(submitted.status).toBe('AWAITING_REVIEW');
    expect(accepted).toMatchObject({
      documentationHandoff: { status: 'ACCEPTED' },
      status: 'READY_FOR_COMPLETION',
    });
    expect(completed).toMatchObject({
      completedAt: now,
      status: 'COMPLETED',
    });
  });

  it('locks assistant editing after submission', () => {
    const assigned = assignWorkspaceDocumentation(
      createMockTreatmentVisit(),
      dentist,
      assistant.userId,
      'handoff-1',
      now,
    );
    const submitted = submitWorkspaceDocumentation(
      startWorkspaceDocumentation(assigned, assistant, now),
      assistant,
      now,
    );

    expect(() =>
      recordWorkspaceAct(submitted, assistant, fillingInput, now),
    ).toThrow('An active assistant assignment is required.');
  });

  it('moves an approved act through execution and records its performer', () => {
    const visit = recordWorkspaceAct(
      createMockTreatmentVisit(),
      dentist,
      fillingInput,
      now,
    );
    const started = transitionWorkspaceAct(
      visit,
      dentist,
      fillingInput.id,
      'IN_PROGRESS',
      now,
    );
    const completed = transitionWorkspaceAct(
      started,
      dentist,
      fillingInput.id,
      'COMPLETED',
      now,
    );

    expect(started.acts.at(-1)?.status).toBe('IN_PROGRESS');
    expect(completed.acts.at(-1)).toMatchObject({
      approvedByDentistId: dentist.userId,
      performedByUserId: dentist.userId,
      status: 'COMPLETED',
    });
    expect(() =>
      transitionWorkspaceAct(
        completed,
        dentist,
        fillingInput.id,
        'PLANNED',
        now,
      ),
    ).toThrow('Treatment act cannot transition to PLANNED.');
  });

  it('keeps assistant periodontal charting as a draft until dentist approval', () => {
    const assigned = assignWorkspaceDocumentation(
      createMockTreatmentVisit(),
      dentist,
      assistant.userId,
      'handoff-periodontal',
      now,
    );
    const started = startWorkspaceDocumentation(assigned, assistant, now);
    const drafted = updateWorkspacePeriodontalExamination(
      started,
      assistant,
      (examination) => updatePeriodontalSite(examination, 16, 'B', { pd: 5 }, now),
      now,
    );

    expect(drafted.periodontalExamination).toMatchObject({
      status: 'DRAFT',
      teeth: [{ toothNumber: 16, sites: { B: { pd: 5 } } }],
    });

    const approved = approveWorkspacePeriodontalExamination(drafted, dentist, now);
    expect(approved.periodontalExamination).toMatchObject({
      status: 'CONFIRMED',
      verifiedByDentistId: dentist.userId,
    });
  });
});
