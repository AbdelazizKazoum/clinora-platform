import type { TreatmentAct, TreatmentVisit } from './treatment';
import type { OdontogramCondition } from '@/features/odontogram';
import { mapTreatmentVisitToOdontogram, type TreatmentOdontogramProjection } from './treatment-odontogram.mapper';

export type TreatmentProjectionMode = 'combined' | 'status-only' | 'plan-only';

export interface TreatmentPlanConflict {
  readonly toothNumber: number;
  readonly recordIds: readonly string[];
  readonly reason: 'overlapping-active-plans';
}

export interface TreatmentPlanDelta {
  readonly toothNumber: number;
  readonly addedConditionKeys: readonly string[];
  readonly sharedConditionKeys: readonly string[];
}

export interface TreatmentToothSummary {
  readonly toothNumber: number;
  readonly existingFindings: readonly string[];
  readonly plannedActs: readonly string[];
  readonly completedActs: readonly string[];
  readonly recordOnlyDetails: readonly string[];
}

export interface TreatmentWorkflowProjection {
  readonly mode: TreatmentProjectionMode;
  readonly projections: Readonly<Record<TreatmentProjectionMode, TreatmentOdontogramProjection>>;
  readonly plannedDelta: readonly TreatmentPlanDelta[];
  readonly conflicts: readonly TreatmentPlanConflict[];
  readonly toothSummaries: readonly TreatmentToothSummary[];
}

export const buildTreatmentWorkflowProjection = (
  visit: TreatmentVisit,
  mode: TreatmentProjectionMode = 'combined',
): TreatmentWorkflowProjection => {
  const statusVisit = buildStatusVisit(visit);
  const planVisit = buildPlanVisit(visit);
  const projections = {
    combined: mapTreatmentVisitToOdontogram(visit),
    'plan-only': mapTreatmentVisitToOdontogram(planVisit),
    'status-only': mapTreatmentVisitToOdontogram(statusVisit),
  } satisfies Record<TreatmentProjectionMode, TreatmentOdontogramProjection>;
  return {
    conflicts: findPlanConflicts(visit),
    mode,
    plannedDelta: buildPlanDelta(projections['status-only'], projections['plan-only']),
    projections,
    toothSummaries: buildTreatmentToothSummaries(visit),
  };
};

export const buildTreatmentToothSummaries = (
  visit: TreatmentVisit,
): readonly TreatmentToothSummary[] => {
  const positions = new Set<number>([
    ...visit.findings.flatMap(({ target }) => target.toothNumbers),
    ...visit.acts.flatMap(({ target }) => target.toothNumbers),
  ]);
  return [...positions].sort((left, right) => left - right).map((toothNumber) => ({
    completedActs: visit.acts
      .filter(({ status, target }) => status === 'COMPLETED' && target.toothNumbers.includes(toothNumber))
      .map(({ code }) => code),
    existingFindings: visit.findings
      .filter(({ status, target }) => status === 'CONFIRMED' && target.toothNumbers.includes(toothNumber))
      .map(({ code }) => code),
    plannedActs: visit.acts
      .filter(({ status, target }) => ['PLANNED', 'IN_PROGRESS'].includes(status) && target.toothNumbers.includes(toothNumber))
      .map(({ code }) => code),
    recordOnlyDetails: visit.findings
      .filter(({ status, target }) => status === 'CONFIRMED' && target.toothNumbers.includes(toothNumber))
      .flatMap(({ code, details }) => details.length === 0 ? [code] : details.map(({ key }) => `${code}:${key}`)),
    toothNumber,
  }));
};

export const buildPlanDelta = (
  status: TreatmentOdontogramProjection,
  plan: TreatmentOdontogramProjection,
): readonly TreatmentPlanDelta[] =>
  plan.data.teeth.flatMap((planTooth) => {
    const statusTooth = status.data.teeth.find(({ position }) => position === planTooth.position);
    if (statusTooth === undefined) return [];
    const statusKeys = new Set(statusTooth.conditions.map(conditionKey));
    const planKeys = new Set(planTooth.conditions.map(conditionKey));
    const addedConditionKeys = [...planKeys].filter((key) => !statusKeys.has(key));
    const sharedConditionKeys = [...planKeys].filter((key) => statusKeys.has(key));
    return addedConditionKeys.length === 0 && sharedConditionKeys.length === 0
      ? []
      : [{ addedConditionKeys, sharedConditionKeys, toothNumber: planTooth.position }];
  });

function buildStatusVisit(visit: TreatmentVisit): TreatmentVisit {
  return {
    ...visit,
    acts: visit.acts.filter(({ status }) => status === 'COMPLETED'),
    findings: visit.findings.filter(({ status }) => status === 'CONFIRMED'),
  };
}

function buildPlanVisit(visit: TreatmentVisit): TreatmentVisit {
  return {
    ...visit,
    acts: visit.acts.filter(({ status }) => ['PLANNED', 'IN_PROGRESS', 'COMPLETED'].includes(status)),
    findings: visit.findings.filter(({ status }) => status === 'CONFIRMED'),
  };
}

function findPlanConflicts(visit: TreatmentVisit): readonly TreatmentPlanConflict[] {
  const activeActs = visit.acts.filter(({ status }) => ['PLANNED', 'IN_PROGRESS'].includes(status));
  const conflicts: TreatmentPlanConflict[] = [];
  const byTooth = new Map<number, TreatmentAct[]>();
  for (const act of activeActs) {
    for (const toothNumber of act.target.toothNumbers) {
      byTooth.set(toothNumber, [...(byTooth.get(toothNumber) ?? []), act]);
    }
  }
  for (const [toothNumber, acts] of byTooth) {
    const overlappingIds = new Set<string>();
    for (let index = 0; index < acts.length; index += 1) {
      for (let candidateIndex = index + 1; candidateIndex < acts.length; candidateIndex += 1) {
        const act = acts[index];
        const candidate = acts[candidateIndex];
        const leftSurfaces = new Set(act.target.surfaces);
        if (
          act.code === candidate.code ||
          candidate.target.surfaces.length === 0 ||
          candidate.target.surfaces.some((surface) => leftSurfaces.has(surface))
        ) {
          overlappingIds.add(act.id);
          overlappingIds.add(candidate.id);
        }
      }
    }
    if (overlappingIds.size > 0) {
      conflicts.push({
        reason: 'overlapping-active-plans',
        recordIds: [...overlappingIds],
        toothNumber,
      });
    }
  }
  return conflicts;
}

function conditionKey(condition: OdontogramCondition): string {
  const record = condition as unknown as Record<string, unknown>;
  const surface = typeof record.surface === 'string' ? `:${record.surface}` : '';
  const concept = typeof record.concept === 'string' ? `:${record.concept}` : '';
  const subtype = typeof record.subtype === 'string' ? `:${record.subtype}` : '';
  const state = typeof record.state === 'string' ? `:${record.state}` : '';
  const restoration = typeof record.restoration === 'string' ? `:${record.restoration}` : '';
  return `${condition.kind}${surface}${concept}${subtype}${state}${restoration}`;
}
