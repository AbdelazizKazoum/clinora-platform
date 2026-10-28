import { Badge, Button, Card, CardBody, CardHeader } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type {
  TreatmentActStatus,
  TreatmentPlanItem,
  TreatmentSession,
} from '../model/treatment';
import { getTreatmentActOption } from '../model/treatment-catalogue';
import { formatTarget, recordStatusVariant } from './treatment-presentation';
import styles from './treatment-plan-timeline.module.scss';

const planStatusLabels: Record<TreatmentActStatus, string> = {
  DRAFT: 'Draft',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ENTERED_IN_ERROR: 'Entered in error',
};

export function TreatmentPlanTimeline({
  plans,
  sessions,
  currentVisitId,
  onSelectVisit,
}: {
  readonly plans: readonly TreatmentPlanItem[];
  readonly sessions: readonly TreatmentSession[];
  readonly currentVisitId: string;
  readonly onSelectVisit: (visitId: string) => void;
}) {
  return (
    <Card className="mt-3">
      <CardHeader className="border-light justify-content-between">
        <h5 className="mb-0">Patient treatment timeline · All visits</h5>
        <small className="text-muted">
          {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
        </small>
      </CardHeader>
      <CardBody className={styles.timelineBody}>
        {plans.map((plan) => {
          const history = sessions.filter(
            (session) =>
              session.planItemId === plan.id &&
              session.patientId === plan.patientId &&
              session.clinicId === plan.clinicId,
          );
          const target =
            plan.target.toothNumbers.length > 0
              ? formatTarget(plan.target.toothNumbers, plan.target.surfaces)
              : plan.target.arch === 'UPPER'
                ? 'Upper arch'
                : plan.target.arch === 'LOWER'
                  ? 'Lower arch'
                  : 'Whole mouth';
          return (
            <details
              key={plan.id}
              className={`${styles.planGroup} border rounded`}
            >
              <summary className={styles.planSummary}>
                <span className={styles.planHeading}>
                  <strong className="fw-semibold">
                    {getTreatmentActOption(plan.code)?.label ?? plan.code}
                  </strong>
                  <small className="text-muted">{target}</small>
                </span>
                <span className={styles.planSummaryMeta}>
                  <Badge bg={recordStatusVariant(plan.status)}>
                    {planStatusLabels[plan.status]}
                  </Badge>
                  <small className="text-muted text-nowrap">
                    {history.length}{' '}
                    {history.length === 1 ? 'session' : 'sessions'}
                  </small>
                </span>
                <Icon
                  icon="chevron-down"
                  className={`${styles.expandIcon} text-muted`}
                  aria-hidden="true"
                />
              </summary>
              <div className={styles.planContent}>
                <small
                  className={`${styles.planOrigin} text-muted border-top pt-3`}
                >
                  <span>
                    <Icon
                      icon={
                        plan.source === 'DOCTOR_DIRECT'
                          ? 'stethoscope'
                          : 'users'
                      }
                      aria-hidden="true"
                    />
                    {plan.source === 'DOCTOR_DIRECT'
                      ? 'Doctor entry'
                      : 'Assistant handoff'}
                  </span>
                  <span>Origin: {plan.originVisitId}</span>
                  <span className="text-muted">Plan {plan.id}</span>
                  {plan.originHandoffId && (
                    <span className="text-muted">
                      Handoff {plan.originHandoffId}
                    </span>
                  )}
                </small>
                {history.length > 0 ? (
                  <ol className={styles.sessionList}>
                    {history.map((session) => (
                      <SessionTimelineEntry
                        key={session.id}
                        session={session}
                        currentVisitId={currentVisitId}
                        onSelectVisit={onSelectVisit}
                      />
                    ))}
                  </ol>
                ) : (
                  <div className={`${styles.emptyState} text-muted py-3`}>
                    <span>
                      <Icon icon="calendar-clock" aria-hidden="true" />
                    </span>
                    <div>
                      <strong className="fw-semibold">
                        No treatment sessions yet
                      </strong>
                      <p className="mb-0 mt-1">
                        The timeline will appear here when this treatment
                        starts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </details>
          );
        })}
        {plans.length === 0 && (
          <div className={`${styles.emptyState} text-muted py-3`}>
            <span>
              <Icon icon="clipboard-list" aria-hidden="true" />
            </span>
            <div>
              <strong className="fw-semibold">
                No treatment plans recorded
              </strong>
              <p className="mb-0 mt-1">
                Each plan’s visit history will appear here.
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function SessionTimelineEntry({
  session,
  currentVisitId,
  onSelectVisit,
}: {
  readonly session: TreatmentSession;
  readonly currentVisitId: string;
  readonly onSelectVisit: (visitId: string) => void;
}) {
  const presentation =
    session.status === 'IN_PROGRESS'
      ? {
          title: 'Treatment in progress',
          label: 'Open session',
          tone: 'primary',
          icon: 'activity',
        }
      : session.status === 'CANCELLED'
        ? {
            title: 'Session cancelled',
            label: 'Cancelled',
            tone: 'secondary',
            icon: 'x',
          }
        : session.outcome === 'CONTINUE_LATER'
          ? {
              title: 'Session completed',
              label: 'Continue later',
              tone: 'warning',
              icon: 'check',
            }
          : session.outcome === 'TREATMENT_FINISHED'
            ? {
                title: 'Treatment completed',
                label: 'Completed',
                tone: 'success',
                icon: 'check-check',
              }
            : {
                title: 'Session closed',
                label: 'Closed',
                tone: 'secondary',
                icon: 'check',
              };
  return (
    <li className={styles.sessionEntry}>
      <time
        className={styles.sessionDate}
        dateTime={session.startedAt.toISOString()}
      >
        <span className="fw-semibold">
          {session.startedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <small className="text-muted">
          {session.startedAt.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </small>
      </time>
      <span className={styles.sessionRail} aria-hidden="true">
        <span
          className={`${styles.sessionMarker} rounded-circle bg-light text-${presentation.tone}`}
        >
          <Icon icon={presentation.icon} />
        </span>
      </span>
      <div className={styles.sessionContent}>
        <div className={styles.sessionHeading}>
          <h6 className="mb-0">{presentation.title}</h6>
          <Badge bg={presentation.tone}>{presentation.label}</Badge>
        </div>
        <small className={`${styles.sessionMeta} text-muted`}>
          <Button
            variant="link"
            className={`${styles.visitLink} p-0`}
            onClick={() => onSelectVisit(session.visitId)}
          >
            <Icon icon="calendar-days" aria-hidden="true" />
            {session.visitId}
            <Icon icon="arrow-up-right" aria-hidden="true" />
          </Button>
          {session.visitId === currentVisitId && (
            <Badge bg="light" text="secondary">
              This visit
            </Badge>
          )}
          <span>
            <Icon icon="user-round" aria-hidden="true" />
            {session.performedByUserId}
          </span>
          <span>Plan version {session.planVersion}</span>
        </small>
        {session.note && (
          <p className={`${styles.sessionNote} text-muted mb-0 mt-2`}>
            {session.note}
          </p>
        )}
      </div>
    </li>
  );
}
