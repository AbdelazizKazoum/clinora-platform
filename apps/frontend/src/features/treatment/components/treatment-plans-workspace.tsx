import { Badge, Button, Card, CardBody, CardHeader } from 'react-bootstrap';
import type {
  TreatmentPlanItem,
  TreatmentSession,
  TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';
import { TreatmentActsTable } from './treatment-acts-table';
import { getTreatmentActOption } from '../model/treatment-catalogue';
import { formatTarget } from './treatment-presentation';

export function TreatmentPlansWorkspace({
  visit,
  planItems,
  sessions,
  actor,
  actions,
  projectionIssueIds,
}: {
  readonly visit: TreatmentVisit;
  readonly planItems: readonly TreatmentPlanItem[];
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
        onApproveAct={actions.approveAct}
        onTransitionAct={actions.transitionAct}
        onCloseSession={actions.closeSession}
        projectionIssueIds={projectionIssueIds}
      />
      <Card className="mt-3">
        <CardHeader>
          <h5 className="mb-0">Patient treatment timeline · All visits</h5>
        </CardHeader>
        <CardBody>
          {plans.map((plan) => {
            const history = sessions.filter(
              (session) => session.planItemId === plan.id,
            );
            return (
              <details key={plan.id} className="border rounded p-3 mb-2">
                <summary>
                  <strong>
                    {getTreatmentActOption(plan.code)?.label ?? plan.code}
                  </strong>
                  {' · '}
                  {formatTarget(plan.target.toothNumbers, plan.target.surfaces)}
                  {' · '}
                  {plan.id}
                </summary>
                <p className="text-muted mt-2 mb-2">
                  Origin: {plan.originVisitId} ·{' '}
                  {plan.source === 'DOCTOR_DIRECT'
                    ? 'Doctor entry'
                    : 'Assistant handoff'}
                  {plan.originHandoffId ? ` · ${plan.originHandoffId}` : ''}
                </p>
                {history.length === 0 && (
                  <p className="text-muted mb-0">No treatment sessions yet.</p>
                )}
                <ol className="mb-0">
                  {history.map((session) => (
                    <li key={session.id} className="mb-3">
                      <Button
                        variant="link"
                        className="p-0 me-2"
                        onClick={() => actions.selectVisit(session.visitId)}
                      >
                        {session.visitId}
                      </Button>
                      <Badge
                        bg={
                          session.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {session.status === 'IN_PROGRESS'
                          ? 'Session in progress'
                          : session.outcome === 'CONTINUE_LATER'
                            ? 'Session closed · Further treatment required'
                            : 'Treatment finished'}
                      </Badge>
                      <small className="text-muted d-block mt-1">
                        {session.startedAt.toLocaleString('en-GB')} · Treating
                        clinician: {session.performedByUserId}
                        {' · '}Plan version {session.planVersion}
                      </small>
                      {session.note && (
                        <p
                          className="mb-0 mt-1"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {session.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            );
          })}
          {plans.length === 0 && (
            <p className="text-muted mb-0">No treatment plans recorded.</p>
          )}
        </CardBody>
      </Card>
    </>
  );
}
