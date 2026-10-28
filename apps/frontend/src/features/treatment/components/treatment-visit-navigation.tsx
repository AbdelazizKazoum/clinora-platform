import { Button, Card, CardBody, Form } from 'react-bootstrap';
import type { TreatmentVisit } from '../model/treatment';
import { treatmentVisitStatusLabels } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';

export function TreatmentVisitNavigation({
  visit,
  visits,
  actor,
  actions,
}: {
  readonly visit: TreatmentVisit;
  readonly visits: readonly TreatmentVisit[];
  readonly actor: MockTreatmentActor;
  readonly actions: Pick<
    TreatmentVisitActions,
    'selectVisit' | 'createNextVisit' | 'completeVisit'
  >;
}) {
  const dentist =
    actor.role === 'doctor' && actor.userId === visit.responsibleDentistId;
  const closed = ['COMPLETED', 'CANCELLED'].includes(visit.status);
  const openVisit = visits.some(
    (candidate) => !['COMPLETED', 'CANCELLED'].includes(candidate.status),
  );
  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-end gap-3">
          <Form.Group controlId="local-treatment-visit" className="flex-grow-1">
            <Form.Label>Visit</Form.Label>
            <Form.Select
              value={visit.id}
              onChange={(event) =>
                actions.selectVisit(event.currentTarget.value)
              }
            >
              {visits.map((candidate, index) => (
                <option key={candidate.id} value={candidate.id}>
                  Visit {index + 1} · {candidate.id} ·{' '}
                  {treatmentVisitStatusLabels[candidate.status]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {dentist && !closed && !visit.documentationHandoff && (
            <Button variant="success" onClick={actions.completeVisit}>
              Complete visit
            </Button>
          )}
          {dentist && (
            <Button
              variant="outline-primary"
              disabled={openVisit}
              onClick={actions.createNextVisit}
            >
              New visit
            </Button>
          )}
        </div>
        <small className="text-muted d-block mt-2">
          {closed
            ? 'This visit is finalized and read-only. Select another visit to continue treatment.'
            : 'Close today’s treatment sessions and resolve documentation before completing this visit.'}{' '}
          Local preview: changes reset when the workspace is reloaded.
        </small>
      </CardBody>
    </Card>
  );
}
