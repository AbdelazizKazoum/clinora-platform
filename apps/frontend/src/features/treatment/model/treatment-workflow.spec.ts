import { createMockTreatmentVisit } from '../mock/treatment-workspace.mock';
import type { TreatmentAct } from './treatment';
import {
  buildTreatmentToothSummaries,
  buildTreatmentWorkflowProjection,
} from './treatment-workflow';

const act = (id: string, code: TreatmentAct['code'], status: TreatmentAct['status'] = 'PLANNED'): TreatmentAct => ({
  approvedByDentistId: 'doctor-demo',
  code,
  createdAt: new Date('2026-08-16T10:00:00.000Z'),
  details: code === 'CROWN' ? [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }] : [],
  enteredByUserId: 'doctor-demo',
  id,
  note: null,
  performedByUserId: null,
  status,
  target: {
    arch: null,
    kind: 'TOOTH',
    periodontalSites: [],
    surfaces: [],
    toothNumbers: [16],
  },
  updatedAt: new Date('2026-08-16T10:00:00.000Z'),
});

describe('PARITY-05 Treatment workflow projections', () => {
  it('keeps confirmed status separate from the active plan', () => {
    const visit = { ...createMockTreatmentVisit(), acts: [act('act-crown-16', 'CROWN')] };
    const workflow = buildTreatmentWorkflowProjection(visit);

    expect(workflow.projections['status-only'].data.teeth.find(({ position }) => position === 16)?.conditions).not.toContainEqual(
      expect.objectContaining({ kind: 'restoration' }),
    );
    expect(workflow.projections['plan-only'].data.teeth.find(({ position }) => position === 16)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'restoration', appearance: 'planned' }),
    );
    expect(workflow.plannedDelta.find(({ toothNumber }) => toothNumber === 16)?.addedConditionKeys).toContain('restoration:crown');
  });

  it('does not report shared confirmed conditions as planned additions', () => {
    const base = createMockTreatmentVisit();
    const workflow = buildTreatmentWorkflowProjection({
      ...base,
      acts: base.acts.map((candidate) => ({ ...candidate, status: 'COMPLETED' as const })),
    });
    const delta = workflow.plannedDelta.find(({ toothNumber }) => toothNumber === 36);
    expect(delta?.addedConditionKeys ?? []).not.toContain('endodontic:root-canal');
    expect(delta?.sharedConditionKeys ?? []).toContain('endodontic:root-canal');
  });

  it('reports deterministic conflicts for overlapping active plans', () => {
    const workflow = buildTreatmentWorkflowProjection({
      ...createMockTreatmentVisit(),
      acts: [act('act-crown-1', 'CROWN'), act('act-crown-2', 'CROWN')],
    });
    expect(workflow.conflicts).toEqual([
      {
        reason: 'overlapping-active-plans',
        recordIds: ['act-crown-1', 'act-crown-2'],
        toothNumber: 16,
      },
    ]);
  });

  it('groups summaries into findings, planned acts, completed acts, and record-only details', () => {
    const summary = buildTreatmentToothSummaries({
      ...createMockTreatmentVisit(),
      acts: [act('act-planned-16', 'CROWN', 'PLANNED'), act('act-completed-16', 'EXTRACTION', 'COMPLETED')],
    }).find(({ toothNumber }) => toothNumber === 16);
    expect(summary?.existingFindings).toContain('CARIES');
    expect(summary?.plannedActs).toContain('CROWN');
    expect(summary?.completedActs).toContain('EXTRACTION');
    expect(summary?.recordOnlyDetails).toContain('CARIES:ICDAS_CARS_SEVERITY');
  });
});
