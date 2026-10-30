import type {
  TreatmentPlanItem,
  TreatmentSession,
  TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';
import { TreatmentActsTable } from './treatment-acts-table';
import { TreatmentPlanTimeline } from './treatment-plan-timeline';

export function TreatmentPlansWorkspace({
  visit,
  planItems,
  removablePlanIds,
  sessions,
  actor,
  actions,
  projectionIssueIds,
}: {
  readonly visit: TreatmentVisit;
  readonly planItems: readonly TreatmentPlanItem[];
  readonly removablePlanIds: ReadonlySet<string>;
  readonly sessions: readonly TreatmentSession[];
  readonly actor: MockTreatmentActor;
  readonly actions: TreatmentVisitActions;
  readonly projectionIssueIds: ReadonlySet<string>;
}) {
  const plans = planItems.filter(
    (plan) =>
      plan.patientId === visit.patientId && plan.clinicId === visit.clinicId,
  );
  const historical = ['COMPLETED', 'CANCELLED'].includes(visit.status);
  return (
    <>
      <p className="text-muted">
        {historical
          ? 'Treatment acts as recorded when this visit was finalized.'
          : 'Existing patient treatment plans. Start or continue a plan to record work in this visit.'}
      </p>
      <TreatmentActsTable
        actor={actor}
        visit={historical ? visit : { ...visit, acts: plans }}
        onTransitionAct={actions.transitionAct}
        onCloseSession={actions.closeSession}
        onRemoveAct={actions.removeAct}
        removablePlanIds={removablePlanIds}
        projectionIssueIds={projectionIssueIds}
      />
      <TreatmentPlanTimeline
        plans={plans}
        sessions={sessions}
        currentVisitId={visit.id}
        onSelectVisit={actions.selectVisit}
      />
    </>
  );
}
