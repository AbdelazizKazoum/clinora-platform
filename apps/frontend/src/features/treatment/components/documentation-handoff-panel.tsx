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
import { canEditTreatmentDraft } from '../model/treatment.rules';
import styles from './documentation-handoff-panel.module.scss';

const roleLabel = (role: MockTreatmentActor['role']) =>
  role === 'secretary' ? 'Secretariat' : 'Dental assistant';

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
    'assignDocumentation' | 'startDocumentation'
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
  const selected = assistants.find(
    ({ userId }) => userId === selectedAssistantId,
  );
  const canAssign =
    actor.role === 'doctor' &&
    actor.userId === visit.responsibleDentistId &&
    visit.status === 'IN_PROGRESS' &&
    !handoff;
  const canSubmit = Boolean(
    selected && instruction.trim() && !assistantsLoading && !assistantsError,
  );
  const canDocument =
    actor.role !== 'doctor' &&
    canEditTreatmentDraft(visit, actor.userId, actor.role);
  return (
    <Card>
      <CardHeader className="justify-content-between">
        <div>
          <CardTitle as="h5" className="mb-1">
            Documentation handoff
          </CardTitle>
          <p className="text-muted mb-0 fs-sm">
            Assign the doctor’s note to an assistant or secretariat user for
            direct documentation.
          </p>
        </div>
        <span className="badge badge-soft-primary text-primary">
          {handoff
            ? documentationHandoffStatusLabels[handoff.status]
            : 'Not assigned'}
        </span>
      </CardHeader>
      <CardBody>
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
            </Col>
            <Col lg={4}>
              <aside className={styles.assignment}>
                <h6 className="text-uppercase text-muted fs-xs mb-3">
                  Assigned to
                </h6>
                <strong className="d-block fw-semibold">
                  {assignedAssistantName ?? 'Assigned staff member'}
                </strong>
                <small className="text-muted">
                  {roleLabel(handoff.assignedToRole ?? 'dental_assistant')}
                </small>
                <hr className="my-3 border-dashed" />
                <p className="text-muted fs-sm">
                  The assigned user can record acts and complete this visit
                  directly. Each entry retains its author and the responsible
                  doctor.
                </p>
                {canDocument && (
                  <p className="text-muted fs-sm">
                    Use the chart and treatment tabs to document the doctor’s
                    work, then complete the visit.
                  </p>
                )}
                {canDocument && handoff.status === 'ASSIGNED' && (
                  <Button onClick={actions.startDocumentation}>
                    Start documentation
                  </Button>
                )}
                {handoff.completedByUserId && (
                  <small className="text-muted d-block">
                    Completed by: {handoff.completedByUserId}
                  </small>
                )}
              </aside>
            </Col>
          </Row>
        ) : canAssign ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit && selected && selected.role !== 'doctor') {
                actions.assignDocumentation(
                  selected.userId,
                  instruction,
                  selected.role,
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
                    required
                    rows={8}
                    value={instruction}
                    onChange={(event) =>
                      onInstructionChange(event.currentTarget.value)
                    }
                    placeholder="Describe the treatment performed and any remaining planned work. Include teeth, surfaces, materials, and clinical details."
                  />
                  <Form.Text>
                    These instructions remain attributed to the doctor.
                    Structured entries record who documented them.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col lg={4}>
                <aside className={styles.assignment}>
                  <Form.Group className="mb-3" controlId="handoff-staff">
                    <Form.Label>Assign to staff member</Form.Label>
                    <Form.Select
                      required
                      value={selected?.userId ?? ''}
                      disabled={
                        assistantsLoading ||
                        Boolean(assistantsError) ||
                        assistants.length === 0
                      }
                      onChange={(event) =>
                        onAssistantChange(event.currentTarget.value)
                      }
                    >
                      <option value="">
                        Select an assistant or secretariat user
                      </option>
                      {assistants.map((candidate) => (
                        <option key={candidate.userId} value={candidate.userId}>
                          {candidate.name} · {roleLabel(candidate.role)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  {assistantsLoading ? (
                    <p role="status">Loading clinic staff...</p>
                  ) : assistantsError ? (
                    <Alert variant="danger">
                      <p>{assistantsError}</p>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        type="button"
                        onClick={onRetryAssistants}
                      >
                        Retry staff list
                      </Button>
                    </Alert>
                  ) : assistants.length === 0 ? (
                    <Alert variant="info">
                      No active assistants or secretariat users are available in
                      this clinic.
                    </Alert>
                  ) : null}
                  <p className="text-muted fs-sm mb-0">
                    Access applies only to the assigned visit. Entries take
                    effect directly without a doctor approval step.
                  </p>
                </aside>
              </Col>
            </Row>
            <div className="d-flex justify-content-end border-top border-dashed pt-3 mt-4">
              <Button disabled={!canSubmit} type="submit">
                {selected ? `Assign to ${selected.name}` : 'Assign handoff'}
                <Icon icon="arrow-right" className="ms-2" />
              </Button>
            </div>
          </Form>
        ) : (
          <p className="text-muted mb-0">
            No handoff assigned. The responsible doctor can assign this visit to
            an assistant or secretariat user.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
