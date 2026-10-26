import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Row,
} from 'react-bootstrap';
import {
  documentationHandoffStatusLabels,
  type TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';
import { handoffStatusReached } from './treatment-presentation';
import styles from './treatment-workspace.module.scss';

export function DocumentationHandoffPanel({
  actor,
  actions,
  assistant,
  instruction,
  onInstructionChange,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly actions: Pick<
    TreatmentVisitActions,
    | 'assignDocumentation'
    | 'startDocumentation'
    | 'submitDocumentation'
    | 'reviewDocumentation'
    | 'completeVisit'
  >;
  readonly assistant: MockTreatmentActor;
  readonly instruction: string;
  readonly onInstructionChange: (instruction: string) => void;
  readonly visit: TreatmentVisit;
}) {
  const handoff = visit.documentationHandoff;
  const canAssign =
    actor.role === 'doctor' &&
    actor.userId === visit.responsibleDentistId &&
    visit.status === 'IN_PROGRESS' &&
    !handoff;
  return (
    <Row className="justify-content-center">
      <Col xl={8}>
        <Card>
          <CardHeader>
            <h5 className="mb-1">Dentist-to-assistant documentation handoff</h5>
            <p className="text-muted mb-0">
              The assistant enters drafts; the responsible dentist retains
              clinical approval and completion authority.
            </p>
          </CardHeader>
          <CardBody>
            <div className={styles.handoffFlow}>
              {['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED'].map(
                (status, index) => (
                  <div
                    className={
                      handoffStatusReached(handoff?.status, status)
                        ? styles.handoffStepActive
                        : styles.handoffStep
                    }
                    key={status}
                  >
                    <span>{index + 1}</span>
                    <small>{status.replaceAll('_', ' ')}</small>
                  </div>
                ),
              )}
            </div>

            {handoff ? (
              <div className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between gap-2">
                  <div>
                    <strong>{assistant.name}</strong>
                    <p className="text-muted mb-0">
                      Dental assistant · Revision {handoff.revision}
                    </p>
                  </div>
                  <Badge bg="info">
                    {documentationHandoffStatusLabels[handoff.status]}
                  </Badge>
                </div>
                <Form.Group
                  className="mt-3"
                  controlId="assigned-handoff-instructions"
                >
                  <Form.Label>Doctor instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    readOnly
                    rows={6}
                    value={handoff.note ?? ''}
                  />
                </Form.Group>
                {handoff.reviewNote && (
                  <Alert className="mb-0 mt-3 py-2" variant="warning">
                    {handoff.reviewNote}
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="light">
                No assistant is assigned to this visit.
              </Alert>
            )}

            {canAssign && (
              <Form
                className="mb-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  actions.assignDocumentation(assistant.userId, instruction);
                }}
              >
                <Form.Group className="mb-3" controlId="handoff-instructions">
                  <Form.Label>Doctor instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    aria-describedby="handoff-instructions-help"
                    onChange={(event) =>
                      onInstructionChange(event.currentTarget.value)
                    }
                    placeholder="Example: Plan an MOD composite restoration on tooth 16 and a crown on tooth 26. Neither treatment has been performed. Tooth 36 is already entered."
                    required
                    rows={6}
                    value={instruction}
                  />
                  <Form.Text id="handoff-instructions-help">
                    Specify the acts, teeth, surfaces, and relevant details.
                    Distinguish planned treatment from work already performed.
                  </Form.Text>
                </Form.Group>
                <p className="text-muted">
                  Assigned to {assistant.name}. The visit stays open until the
                  assistant submits the entries and the dentist reviews them.
                </p>
                <Button disabled={!instruction.trim()} type="submit">
                  Assign to {assistant.name}
                </Button>
              </Form>
            )}

            <div className="d-flex flex-wrap gap-2">
              {actor.role === 'dental_assistant' &&
                (handoff?.status === 'ASSIGNED' ||
                  handoff?.status === 'RETURNED') && (
                  <Button onClick={() => actions.startDocumentation()}>
                    Start documentation
                  </Button>
                )}
              {actor.role === 'dental_assistant' &&
                handoff?.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => actions.submitDocumentation()}
                    variant="success"
                  >
                    Submit for review
                  </Button>
                )}
              {actor.role === 'doctor' && handoff?.status === 'SUBMITTED' && (
                <>
                  <Button
                    onClick={() => actions.reviewDocumentation('ACCEPT')}
                    variant="success"
                  >
                    Accept documentation
                  </Button>
                  <Button
                    onClick={() => actions.reviewDocumentation('RETURN')}
                    variant="outline-warning"
                  >
                    Return for correction
                  </Button>
                </>
              )}
              {actor.role === 'doctor' &&
                visit.status === 'READY_FOR_COMPLETION' && (
                  <Button
                    onClick={() => actions.completeVisit()}
                    variant="primary"
                  >
                    Complete visit
                  </Button>
                )}
            </div>
            <small className="text-muted d-block mt-3">
              Use the demo role selector above to walk through both sides of the
              workflow.
            </small>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}
