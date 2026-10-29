import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
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
  ['ASSIGNED', 'Assignment', 'Choose an assistant', 'user-check'],
  [
    'IN_PROGRESS',
    'Documentation',
    'Prepare clinical entries',
    'clipboard-list',
  ],
  ['SUBMITTED', 'Submission', 'Send entries to the dentist', 'send'],
  ['ACCEPTED', 'Review', 'Dentist approval', 'circle-check'],
] as const;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

function AssistantSummary({ name }: { readonly name: string }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="avatar-lg flex-shrink-0" aria-hidden="true">
        <span className="avatar-title bg-primary-subtle text-primary rounded-circle fw-semibold">
          {initials(name)}
        </span>
      </div>
      <div className="text-break">
        <strong className="d-block fw-semibold">{name}</strong>
        <small className="text-muted">Dental assistant</small>
      </div>
    </div>
  );
}

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
    <Card>
      <CardHeader className="justify-content-between">
        <div>
          <CardTitle as="h5" className="mb-1">
            Assistant handoff
          </CardTitle>
          <p className="text-muted mb-0 fs-sm">
            Share visit instructions and review the assistant’s entries.
          </p>
        </div>
        <span className="badge badge-soft-primary text-primary">
          {handoff
            ? documentationHandoffStatusLabels[handoff.status]
            : 'Not assigned'}
        </span>
      </CardHeader>
      <CardBody>
        <ol
          className={`nav nav-tabs wizard-tabs mb-4 ${styles.progress}`}
          aria-label="Handoff progress"
        >
          {handoffSteps.map(([status, label, description, icon], index) => {
            const isCurrent =
              handoff?.status === 'RETURNED'
                ? status === 'IN_PROGRESS'
                : handoff
                  ? handoff.status === status
                  : index === 0;
            const isDone =
              handoffStatusReached(handoff?.status, status) &&
              (!isCurrent || handoff?.status === 'ACCEPTED');
            return (
              <li
                className="nav-item"
                key={status}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={`nav-link ${styles.step} ${isDone ? 'wizard-item-done' : isCurrent ? 'active' : ''}`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Icon
                      icon={isDone ? 'circle-check' : icon}
                      className="fs-24 flex-shrink-0 d-none d-sm-block"
                    />
                    <div>
                      <span className="d-block fw-semibold text-body fs-sm">
                        {label}
                      </span>
                      <small className="fs-xxs">{description}</small>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {handoff ? (
          <Row className="g-4">
            <Col lg={8}>
              <Form.Group controlId="assigned-handoff-instructions">
                <Form.Label>Doctor instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  className={styles.notes}
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
            </Col>
            <Col lg={4}>
              <aside className={styles.assignment}>
                <h6 className="text-uppercase text-muted fs-xs mb-3">
                  Assigned to
                </h6>
                <AssistantSummary
                  name={assignedAssistantName ?? 'Assigned dental assistant'}
                />
                <hr className="my-3 border-dashed" />
                <dl className="row fs-sm mb-3">
                  <dt className="col-6 text-muted fw-normal">Scope</dt>
                  <dd className="col-6 text-end mb-2">Full visit</dd>
                  <dt className="col-6 text-muted fw-normal">Revision</dt>
                  <dd className="col-6 text-end mb-0">{handoff.revision}</dd>
                </dl>
                <p className="text-muted mb-0 fs-sm">
                  Entries are submitted to the responsible dentist for approval.
                </p>
              </aside>
            </Col>
          </Row>
        ) : !canAssign ? (
          <div className="text-center py-4">
            <Icon icon="user-check" className="text-muted fs-32 mb-3" />
            <h6 className="mb-2">No handoff assigned</h6>
            <p className="text-muted mb-0">
              The dentist will select an assistant and share instructions for
              this visit.
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
            <Row className="g-4">
              <Col lg={8}>
                <Form.Group controlId="handoff-instructions">
                  <Form.Label>Doctor instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    className={styles.notes}
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
                    Be specific about the teeth, clinical details, and work to
                    record.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col lg={4}>
                <aside className={styles.assignment}>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h6 className="text-uppercase text-muted fs-xs mb-0">
                      Care team
                    </h6>
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
                        <option key={candidate.userId} value={candidate.userId}>
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
                      No active dental assistants are available in this clinic.
                    </Alert>
                  ) : null}
                  {selectedAssistant && (
                    <div className="border border-dashed rounded p-3 mb-3">
                      <AssistantSummary name={selectedAssistant.name} />
                    </div>
                  )}
                  <p className="text-muted fs-sm mb-0">
                    Assign the full visit to one assistant. You’ll review their
                    entries before completing the visit.
                  </p>
                </aside>
              </Col>
            </Row>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-top border-dashed pt-3 mt-4">
              <span className="text-muted fs-sm">
                <Icon icon="shield-check" className="me-1" /> Clinical approval
                stays with the dentist.
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

        <div
          className={
            handoff
              ? 'd-flex flex-wrap justify-content-end gap-2 border-top border-dashed pt-3 mt-4'
              : undefined
          }
        >
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
              <Button onClick={() => actions.completeVisit()} variant="primary">
                Complete visit
              </Button>
            )}
        </div>
      </CardBody>
    </Card>
  );
}
