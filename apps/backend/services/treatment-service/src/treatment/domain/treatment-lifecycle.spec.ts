import {
  CLINICAL_FINDING_CODES as CONTRACT_FINDING_CODES,
  TREATMENT_ACT_CODES as CONTRACT_ACT_CODES,
} from '@clinora/contracts-treatment';

import {
  CLINICAL_FINDING_CODES,
  TREATMENT_ACT_CODES,
} from './treatment-catalogue';
import {
  assignVisitDocumentation,
  canActorEditDraftDocumentation,
  completeTreatmentVisit,
  markVisitReadyForCompletion,
  recordClinicalFinding,
  recordTreatmentAct,
  reviewVisitDocumentation,
  startTreatmentVisit,
  startVisitDocumentation,
  submitVisitDocumentation,
  transitionClinicalFinding,
  transitionTreatmentAct,
} from './treatment-lifecycle';
import {
  createTreatmentVisit,
  TreatmentDomainError,
  type TreatmentActor,
  type TreatmentVisit,
} from './treatment-visit';

const dentist: TreatmentActor = { userId: 'dentist-1', role: 'DOCTOR' };
const assistant: TreatmentActor = {
  userId: 'assistant-1',
  role: 'DENTAL_ASSISTANT',
};
const now = new Date('2026-08-13T10:00:00.000Z');

const createVisit = (): TreatmentVisit =>
  createTreatmentVisit(
    {
      id: 'visit-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      responsibleDentistId: dentist.userId,
      appointmentId: 'appointment-1',
      queueEntryId: 'queue-1',
      chairId: 'chair-1',
    },
    dentist,
    now,
  );

describe('treatment bounded context', () => {
  it('keeps domain and public catalogue codes in parity', () => {
    expect(TREATMENT_ACT_CODES).toEqual(CONTRACT_ACT_CODES);
    expect(CLINICAL_FINDING_CODES).toEqual(CONTRACT_FINDING_CODES);
  });

  it('starts a draft only through the responsible dentist', () => {
    const draft = createVisit();
    const started = startTreatmentVisit(draft, dentist, now);

    expect(started).toMatchObject({
      status: 'IN_PROGRESS',
      startedAt: now,
    });
    expect(() => startTreatmentVisit(draft, assistant, now)).toThrow(
      TreatmentDomainError,
    );
  });

  it('supports assign, work, submit, return, resubmit, and accept', () => {
    let visit = startTreatmentVisit(createVisit(), dentist, now);
    visit = assignVisitDocumentation(
      visit,
      dentist,
      { handoffId: 'handoff-1', assistantId: assistant.userId },
      now,
    );

    expect(canActorEditDraftDocumentation(visit, assistant)).toBe(true);
    visit = startVisitDocumentation(visit, assistant, now);
    visit = submitVisitDocumentation(visit, assistant, 'Draft ready', now);
    expect(visit.status).toBe('AWAITING_REVIEW');
    expect(canActorEditDraftDocumentation(visit, assistant)).toBe(false);

    visit = reviewVisitDocumentation(
      visit,
      dentist,
      'RETURN',
      'Confirm distal surface.',
      now,
    );
    expect(visit.documentationHandoff).toMatchObject({
      status: 'RETURNED',
      revision: 2,
    });

    visit = startVisitDocumentation(visit, assistant, now);
    visit = submitVisitDocumentation(visit, assistant, null, now);
    visit = reviewVisitDocumentation(visit, dentist, 'ACCEPT', null, now);
    expect(visit).toMatchObject({
      status: 'READY_FOR_COMPLETION',
      documentationHandoff: { status: 'ACCEPTED', revision: 2 },
    });
  });

  it('does not allow an assistant or administrator to approve clinical acts', () => {
    const visit: TreatmentVisit = {
      ...startTreatmentVisit(createVisit(), dentist, now),
      acts: [
        {
          id: 'act-1',
          code: 'DIRECT_FILLING',
          status: 'DRAFT',
          target: {
            kind: 'TOOTH_SURFACE',
            arch: null,
            toothNumbers: [16],
            surfaces: ['OCCLUSAL'],
            periodontalSites: [],
          },
          details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }],
          note: null,
          enteredByUserId: assistant.userId,
          approvedByDentistId: null,
          performedByUserId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    expect(() =>
      transitionTreatmentAct(visit, assistant, 'act-1', 'PLANNED', now),
    ).toThrow(TreatmentDomainError);
    expect(() =>
      transitionTreatmentAct(
        visit,
        { userId: 'admin-1', role: 'ADMIN' },
        'act-1',
        'PLANNED',
        now,
      ),
    ).toThrow(TreatmentDomainError);

    const planned = transitionTreatmentAct(
      visit,
      dentist,
      'act-1',
      'PLANNED',
      now,
    );
    expect(planned.acts[0]).toMatchObject({
      status: 'PLANNED',
      approvedByDentistId: dentist.userId,
    });
  });

  it('records assistant entries as drafts for explicit dentist review', () => {
    let visit = startTreatmentVisit(createVisit(), dentist, now);
    visit = assignVisitDocumentation(
      visit,
      dentist,
      { handoffId: 'handoff-1', assistantId: assistant.userId },
      now,
    );
    visit = startVisitDocumentation(visit, assistant, now);
    visit = recordClinicalFinding(
      visit,
      assistant,
      {
        id: 'finding-1',
        code: 'CARIES',
        target: {
          kind: 'TOOTH_SURFACE',
          arch: null,
          toothNumbers: [16],
          surfaces: ['OCCLUSAL'],
          periodontalSites: [],
        },
        details: [{ key: 'ICDAS_CARS_SEVERITY', value: 4 }],
      },
      now,
    );
    visit = recordTreatmentAct(
      visit,
      assistant,
      {
        id: 'act-1',
        code: 'DIRECT_FILLING',
        target: {
          kind: 'TOOTH_SURFACE',
          arch: null,
          toothNumbers: [16],
          surfaces: ['OCCLUSAL'],
          periodontalSites: [],
        },
        details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }],
      },
      now,
    );

    expect(visit.findings[0]).toMatchObject({
      status: 'DRAFT',
      enteredByUserId: assistant.userId,
      verifiedByUserId: null,
    });
    expect(visit.acts[0]).toMatchObject({
      status: 'DRAFT',
      enteredByUserId: assistant.userId,
      approvedByDentistId: null,
    });

    visit = transitionClinicalFinding(
      visit,
      dentist,
      'finding-1',
      'CONFIRMED',
      now,
    );
    visit = transitionTreatmentAct(visit, dentist, 'act-1', 'PLANNED', now);
    expect(visit.findings[0]).toMatchObject({
      status: 'CONFIRMED',
      verifiedByUserId: dentist.userId,
    });
    expect(visit.acts[0]).toMatchObject({
      status: 'PLANNED',
      approvedByDentistId: dentist.userId,
    });
  });

  it('blocks unassigned assistants and locks submitted assistant drafts', () => {
    const started = startTreatmentVisit(createVisit(), dentist, now);
    const findingInput = {
      id: 'finding-1',
      code: 'CARIES' as const,
      target: {
        kind: 'TOOTH_SURFACE' as const,
        arch: null,
        toothNumbers: [16],
        surfaces: ['OCCLUSAL' as const],
        periodontalSites: [],
      },
    };

    expect(() =>
      recordClinicalFinding(started, assistant, findingInput, now),
    ).toThrow(
      expect.objectContaining({ code: 'DOCUMENTATION_ASSIGNMENT_REQUIRED' }),
    );

    let delegated = assignVisitDocumentation(
      started,
      dentist,
      { handoffId: 'handoff-1', assistantId: assistant.userId },
      now,
    );
    delegated = startVisitDocumentation(delegated, assistant, now);
    delegated = submitVisitDocumentation(delegated, assistant, null, now);
    expect(() =>
      recordClinicalFinding(delegated, assistant, findingInput, now),
    ).toThrow(
      expect.objectContaining({ code: 'DOCUMENTATION_ASSIGNMENT_REQUIRED' }),
    );
  });

  it('completes only a reviewed visit with no unresolved drafts', () => {
    const ready = markVisitReadyForCompletion(
      startTreatmentVisit(createVisit(), dentist, now),
      dentist,
      now,
    );
    expect(completeTreatmentVisit(ready, dentist, now).status).toBe(
      'COMPLETED',
    );

    const withDraft = {
      ...ready,
      findings: [
        {
          id: 'finding-1',
          code: 'CARIES' as const,
          status: 'DRAFT' as const,
          target: {
            kind: 'TOOTH_SURFACE' as const,
            arch: null,
            toothNumbers: [16],
            surfaces: ['OCCLUSAL' as const],
            periodontalSites: [],
          },
          details: [],
          note: null,
          enteredByUserId: assistant.userId,
          verifiedByUserId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    expect(() => completeTreatmentVisit(withDraft, dentist, now)).toThrow(
      expect.objectContaining({ code: 'UNRESOLVED_CLINICAL_DRAFTS' }),
    );
  });
});
