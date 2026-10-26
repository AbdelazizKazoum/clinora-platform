import { createMockTreatmentVisit } from '../mock/treatment-workspace.mock';
import { mapTreatmentVisitToOdontogram } from './treatment-odontogram.mapper';
import {
  approveWorkspacePeriodontalExamination,
  approveWorkspaceAct,
  assignWorkspaceDocumentation,
  completeWorkspaceVisit,
  recordWorkspaceAct,
  recordWorkspaceFinding,
  removeWorkspaceFinding,
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
  it('assigns the doctor instructions without completing the visit or creating acts', () => {
    const visit = createMockTreatmentVisit();
    const instruction =
      'Plan an MOD composite restoration on tooth 16.\nPlan a crown on tooth 26.';
    const assigned = assignWorkspaceDocumentation(
      visit,
      dentist,
      assistant.userId,
      'handoff-text',
      `  ${instruction}  `,
      now,
    );

    expect(assigned.documentationHandoff).toMatchObject({
      note: instruction,
      assignedByDentistId: dentist.userId,
      assignedToAssistantId: assistant.userId,
      status: 'ASSIGNED',
    });
    expect(assigned.status).toBe('IN_PROGRESS');
    expect(assigned.completedAt).toBeNull();
    expect(assigned.acts).toBe(visit.acts);
    expect(assigned.auditHistory?.at(-1)).toMatchObject({
      action: 'DOCUMENTATION_ASSIGNED',
      actorUserId: dentist.userId,
      recordId: 'handoff-text',
    });
    expect(() =>
      assignWorkspaceDocumentation(
        assigned,
        dentist,
        assistant.userId,
        'replacement',
        'Replace instructions.',
        now,
      ),
    ).toThrow('Only an in-progress visit without a handoff can be assigned.');
  });

  it('rejects blank instructions and unauthorized or closed-visit assignment', () => {
    const visit = createMockTreatmentVisit();
    expect(() =>
      assignWorkspaceDocumentation(
        visit,
        dentist,
        assistant.userId,
        'handoff-text',
        '  \n  ',
        now,
      ),
    ).toThrow('Enter instructions for the assistant');
    expect(() =>
      assignWorkspaceDocumentation(
        visit,
        assistant,
        assistant.userId,
        'handoff-text',
        'Plan a crown.',
        now,
      ),
    ).toThrow('Only the responsible dentist');
    expect(() =>
      assignWorkspaceDocumentation(
        visit,
        { ...dentist, userId: 'another-doctor' },
        assistant.userId,
        'handoff-text',
        'Plan a crown.',
        now,
      ),
    ).toThrow('Only the responsible dentist');
    for (const status of ['COMPLETED', 'CANCELLED'] as const) {
      expect(() =>
        assignWorkspaceDocumentation(
          { ...visit, status },
          dentist,
          assistant.userId,
          'handoff-text',
          'Plan a crown.',
          now,
        ),
      ).toThrow('This visit is read-only.');
    }
  });

  it('removes a draft finding and audits the removal', () => {
    const assigned = assignWorkspaceDocumentation(
      createMockTreatmentVisit(),
      dentist,
      assistant.userId,
      'handoff-finding',
      'Plan an occlusal composite restoration on tooth 16.',
      now,
    );
    const drafted = recordWorkspaceFinding(
      startWorkspaceDocumentation(assigned, assistant, now),
      assistant,
      {
        code: 'CALCULUS',
        details: [],
        id: 'finding-assistant-draft',
        target: {
          arch: null,
          kind: 'TOOTH' as const,
          periodontalSites: [],
          surfaces: [],
          toothNumbers: [16],
        },
      },
      now,
    );

    const removed = removeWorkspaceFinding(
      drafted,
      assistant,
      'finding-assistant-draft',
      undefined,
      now,
    );

    expect(removed.findings).toHaveLength(createMockTreatmentVisit().findings.length);
    expect(removed.auditHistory?.at(-1)).toMatchObject({
      action: 'FINDING_REMOVED',
      actorUserId: assistant.userId,
      recordId: 'finding-assistant-draft',
    });
  });

  it('marks a confirmed finding entered in error instead of deleting it', () => {
    const removed = removeWorkspaceFinding(
      createMockTreatmentVisit(),
      dentist,
      'finding-demo-caries-16',
      'Recorded against the wrong tooth.',
      now,
    );

    expect(removed.findings.find(({ id }) => id === 'finding-demo-caries-16'))
      .toMatchObject({ status: 'ENTERED_IN_ERROR' });
    expect(removed.auditHistory?.at(-1)).toMatchObject({
      action: 'FINDING_ENTERED_IN_ERROR',
      reason: 'Recorded against the wrong tooth.',
    });
  });

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
      'Plan an occlusal composite restoration on tooth 16.',
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
      'Plan an occlusal composite restoration on tooth 16.',
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
      'Plan an occlusal composite restoration on tooth 16.',
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
      'Plan an occlusal composite restoration on tooth 16.',
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
