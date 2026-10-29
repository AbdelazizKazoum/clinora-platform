import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Row,
} from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import {
  documentationHandoffStatusLabels,
  type TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';
import { handoffStatusReached } from './treatment-presentation';
import styles from './documentation-handoff-panel.module.scss';

const handoffSteps = [
  ['ASSIGNED', 'Assign'],
  ['IN_PROGRESS', 'Document'],
  ['SUBMITTED', 'Submit'],
  ['ACCEPTED', 'Review'],
] as const;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

export function DocumentationHandoffPanel({
  actor,
  actions,
  assistants,
  assignedAssistantName,
  selectedAssistantId,
  onAssistantChange,
  assistantsLoading,
  assistantsError,
  onRetryAssistants,
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
  readonly assistants: readonly MockTreatmentActor[];
  readonly assignedAssistantName: string | null;
  readonly selectedAssistantId: string;
  readonly onAssistantChange: (id: string) => void;
  readonly assistantsLoading: boolean;
  readonly assistantsError: string | null;
  readonly onRetryAssistants: () => void;
  readonly instruction: string;
  readonly onInstructionChange: (instruction: string) => void;
  readonly visit: TreatmentVisit;
}) {
  const handoff = visit.documentationHandoff;
  const selectedAssistant = assistants.find(
    ({ userId }) => userId === selectedAssistantId,
  );
  const canSubmit = Boolean(
    selectedAssistant &&
      instruction.trim() &&
      !assistantsLoading &&
      !assistantsError,
  );
  const isAssignedAssistant =
    actor.role === 'dental_assistant' &&
    handoff?.assignedToAssistantId === actor.userId;
  const canAssign =
    actor.role === 'doctor' &&
    actor.userId === visit.responsibleDentistId &&
    visit.status === 'IN_PROGRESS' &&
    !handoff;
  return (
    <Row className="justify-content-center">
      <Col xxl={10}>
        <Card className={styles.handoffCard}>
          <CardHeader className={styles.header}>
            <div className={styles.heading}>
              <span className={styles.headingIcon}>
                <Icon icon="clipboard-list" />
              </span>
              <div>
                <h5 className="mb-1">Assistant handoff</h5>
                <p className="text-muted mb-0">
                  Share visit instructions and review the assistant’s entries.
                </p>
              </div>
            </div>
            <span className="badge badge-soft-primary text-primary">
              {handoff
                ? documentationHandoffStatusLabels[handoff.status]
                : 'Not assigned'}
            </span>
          </CardHeader>
          <CardBody className={styles.body}>
            <ol className={styles.flow} aria-label="Handoff progress">
              {handoffSteps.map(([status, label], index) => (
                <li
                  className={
                    handoffStatusReached(handoff?.status, status)
                      ? styles.stepActive
                      : styles.step
                  }
                  key={status}
                >
                  <span>{index + 1}</span>
                  <small>{label}</small>
                </li>
              ))}
            </ol>

            {handoff ? (
              <div className={styles.grid}>
                <section className={styles.instructions}>
                  <Form.Group controlId="assigned-handoff-instructions">
                    <Form.Label>Doctor instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      readOnly
                      rows={8}
                      value={handoff.note ?? ''}
                    />
                  </Form.Group>
                  {handoff.reviewNote && (
                    <Alert className="mb-0 mt-3 py-2" variant="warning">
                      {handoff.reviewNote}
                    </Alert>
                  )}
                </section>
                <aside className={styles.assignee}>
                  <h6 className={styles.sectionLabel}>Assigned to</h6>
                  <div className={styles.person}>
                    <span className={styles.avatar} aria-hidden="true">
                      {initials(assignedAssistantName ?? 'Dental assistant')}
                    </span>
                    <div>
                      <strong>
                        {assignedAssistantName ?? 'Assigned dental assistant'}
                      </strong>
                      <small>Dental assistant</small>
                    </div>
                  </div>
                  <dl className={styles.details}>
                    <div>
                      <dt>Scope</dt>
                      <dd>Full visit</dd>
                    </div>
                    <div>
                      <dt>Revision</dt>
                      <dd>{handoff.revision}</dd>
                    </div>
                  </dl>
                  <p className="text-muted mb-0 fs-sm">
                    Entries are submitted to the responsible dentist for
                    approval.
                  </p>
                </aside>
              </div>
            ) : !canAssign ? (
              <div className={styles.empty}>
                <Icon icon="user-check" className="text-primary fs-2" />
                <h6>No handoff assigned</h6>
                <p className="text-muted mb-0">
                  The dentist will select an assistant and share instructions
                  for this visit.
                </p>
              </div>
            ) : null}

            {canAssign && (
              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canSubmit && selectedAssistant) {
                    actions.assignDocumentation(
                      selectedAssistant.userId,
                      instruction,
                    );
                  }
                }}
              >
                <div className={styles.grid}>
                  <section className={styles.instructions}>
                    <Form.Group controlId="handoff-instructions">
                      <Form.Label>Doctor instructions</Form.Label>
                      <Form.Control
                        as="textarea"
                        aria-describedby="handoff-instructions-help"
                        onChange={(event) =>
                          onInstructionChange(event.currentTarget.value)
                        }
                        placeholder={
                          'Describe the findings or treatment to document.\nInclude tooth numbers, surfaces, materials, and whether treatment is planned or completed.'
                        }
                        required
                        rows={8}
                        value={instruction}
                      />
                      <Form.Text id="handoff-instructions-help">
                        Be specific about the teeth, clinical details, and work
                        to record.
                      </Form.Text>
                    </Form.Group>
                  </section>
                  <aside className={styles.assignee}>
                    <div className={styles.assigneeHeading}>
                      <h6 className={styles.sectionLabel}>Assignment</h6>
                      <span className="badge badge-soft-success text-success">
                        {assistants.length} available
                      </span>
                    </div>
                    <Form.Group className="mb-3" controlId="handoff-assistant">
                      <Form.Label>Assign to assistant</Form.Label>
                      <Form.Select
                        disabled={
                          assistantsLoading ||
                          Boolean(assistantsError) ||
                          assistants.length === 0
                        }
                        onChange={(event) =>
                          onAssistantChange(event.currentTarget.value)
                        }
                        required
                        value={selectedAssistant?.userId ?? ''}
                      >
                        <option value="">Select a dental assistant</option>
                        {assistants.map((candidate) => (
                          <option
                            key={candidate.userId}
                            value={candidate.userId}
                          >
                            {candidate.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    {assistantsLoading ? (
                      <p role="status">Loading clinic assistants...</p>
                    ) : assistantsError ? (
                      <Alert variant="danger">
                        <p>{assistantsError}</p>
                        <Button
                          onClick={onRetryAssistants}
                          size="sm"
                          variant="outline-danger"
                          type="button"
                        >
                          Retry assistant list
                        </Button>
                      </Alert>
                    ) : assistants.length === 0 ? (
                      <Alert variant="info">
                        No active dental assistants are available in this
                        clinic.
                      </Alert>
                    ) : null}
                    {selectedAssistant && (
                      <div className={styles.person}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initials(selectedAssistant.name)}
                        </span>
                        <div>
                          <strong>{selectedAssistant.name}</strong>
                          <small>Dental assistant</small>
                        </div>
                        <Icon
                          icon="circle-check"
                          className="text-success ms-auto"
                        />
                      </div>
                    )}
                    <p className="text-muted fs-sm mb-0">
                      Assign the full visit to one assistant. You’ll review
                      their entries before completing the visit.
                    </p>
                  </aside>
                </div>
                <div className={styles.footer}>
                  <span className="text-muted fs-sm">
                    <Icon icon="shield-check" className="me-1" /> Clinical
                    approval stays with the dentist.
                  </span>
                  <Button disabled={!canSubmit} type="submit">
                    {selectedAssistant
                      ? `Assign to ${selectedAssistant.name}`
                      : 'Assign handoff'}
                    <Icon icon="arrow-right" className="ms-2" />
                  </Button>
                </div>
              </Form>
            )}

            <div className={handoff ? styles.actions : undefined}>
              {isAssignedAssistant &&
                (handoff?.status === 'ASSIGNED' ||
                  handoff?.status === 'RETURNED') && (
                  <Button onClick={() => actions.startDocumentation()}>
                    Start documentation
                  </Button>
                )}
              {isAssignedAssistant && handoff?.status === 'IN_PROGRESS' && (
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
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}
