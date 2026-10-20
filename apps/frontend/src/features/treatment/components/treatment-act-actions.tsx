import { Button } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type { TreatmentAct, TreatmentActStatus } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';

export function TreatmentActActions({
  act,
  actor,
  onApprove,
  onTransition,
}: {
  readonly act: TreatmentAct;
  readonly actor: MockTreatmentActor;
  readonly onApprove: (id: string) => void;
  readonly onTransition: (id: string, status: TreatmentActStatus) => void;
}) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-1">
      {act.status === 'DRAFT' && actor.role === 'doctor' && (
        <Button size="sm" variant="success" onClick={() => onApprove(act.id)}>
          <Icon icon="check" className="me-1" />
          Approve
        </Button>
      )}
      {act.status === 'PLANNED' && actor.role === 'doctor' && (
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => onTransition(act.id, 'IN_PROGRESS')}
        >
          <Icon icon="play" className="me-1" />
          Start
        </Button>
      )}
      {(act.status === 'PLANNED' || act.status === 'IN_PROGRESS') &&
        actor.role === 'doctor' && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => onTransition(act.id, 'COMPLETED')}
            >
              <Icon icon="check-circle" className="me-1" />
              Done
            </Button>
            {act.status !== 'IN_PROGRESS' && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => onTransition(act.id, 'CANCELLED')}
              >
                <Icon icon="x" className="me-1" />
                Cancel
              </Button>
            )}
          </>
        )}
    </div>
  );
}

export function ActLifecycleButtons({
  act,
  onTransition,
}: {
  readonly act: TreatmentAct;
  readonly onTransition: (id: string, status: TreatmentActStatus) => void;
}) {
  if (act.status !== 'PLANNED' && act.status !== 'IN_PROGRESS') return null;

  return (
    <div className="d-flex flex-wrap gap-1">
      {act.status === 'PLANNED' && (
        <Button
          onClick={() => onTransition(act.id, 'IN_PROGRESS')}
          size="sm"
          variant="outline-primary"
        >
          Start
        </Button>
      )}
      <Button
        onClick={() => onTransition(act.id, 'COMPLETED')}
        size="sm"
        variant="success"
      >
        Done
      </Button>
    </div>
  );
}
