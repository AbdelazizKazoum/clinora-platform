import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type {
  TreatmentAct,
  TreatmentActStatus,
  TreatmentSessionOutcome,
  TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { canEditTreatmentDraft } from '../model/treatment.rules';

export function TreatmentActActions({
  act,
  actor,
  visit,
  onApprove,
  onTransition,
  onCloseSession,
  canRemove,
  onRemove,
}: {
  readonly act: TreatmentAct;
  readonly actor: MockTreatmentActor;
  readonly visit: TreatmentVisit;
  readonly onApprove: (id: string) => void;
  readonly canRemove: boolean;
  readonly onRemove: (id: string) => void;
  readonly onTransition: (
    id: string,
    status: TreatmentActStatus,
    reason?: string,
  ) => void;
  readonly onCloseSession: (
    id: string,
    outcome: TreatmentSessionOutcome,
    note: string,
  ) => void;
}) {
  const [dialog, setDialog] = useState<'close' | 'cancel' | 'error' | null>(
    null,
  );
  const [note, setNote] = useState('');
  if (
    actor.role !== 'doctor' ||
    !canEditTreatmentDraft(visit, actor.userId, actor.role)
  )
    return null;
  const session = visit.treatmentSessions?.find(
    (candidate) =>
      candidate.planItemId === act.id && candidate.visitId === visit.id,
  );
  const active = session?.status === 'IN_PROGRESS';
  const canStart =
    ['PLANNED', 'IN_PROGRESS'].includes(act.status) &&
    !session &&
    ['IN_PROGRESS', 'READY_FOR_COMPLETION'].includes(visit.status);
  const submit = (outcome: TreatmentSessionOutcome) => {
    if (!note.trim()) return;
    if (dialog === 'cancel' || dialog === 'error')
      onTransition(
        act.id,
        dialog === 'cancel' ? 'CANCELLED' : 'ENTERED_IN_ERROR',
        note,
      );
    else if (session) onCloseSession(session.id, outcome, note);
    setDialog(null);
    setNote('');
  };
  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-1">
        {act.status === 'DRAFT' && (
          <Button size="sm" variant="success" onClick={() => onApprove(act.id)}>
            <Icon icon="check" className="me-1" />
            Approve
          </Button>
        )}
        {canStart && (
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onTransition(act.id, 'IN_PROGRESS')}
          >
            <Icon icon="play" className="me-1" />
            {act.status === 'IN_PROGRESS' ? 'Continue in this visit' : 'Start'}
          </Button>
        )}
        {active && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setDialog('close')}
          >
            Close session
          </Button>
        )}
        {canRemove && (
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => onRemove(act.id)}
          >
            <Icon icon="trash-2" className="me-1" />
            Remove
          </Button>
        )}
        {['PLANNED', 'IN_PROGRESS'].includes(act.status) && !canRemove && (
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => setDialog('cancel')}
          >
            Cancel
          </Button>
        )}
        {['IN_PROGRESS', 'COMPLETED'].includes(act.status) && (
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setDialog('error')}
          >
            Correct
          </Button>
        )}
        {session?.status === 'COMPLETED' &&
          session.outcome === 'CONTINUE_LATER' &&
          act.status === 'IN_PROGRESS' && (
            <small className="text-muted">
              Session closed · Continue in a later visit
            </small>
          )}
      </div>
      <Modal show={dialog !== null} onHide={() => setDialog(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {dialog === 'cancel'
              ? 'Cancel treatment plan'
              : dialog === 'error'
                ? 'Correct treatment entry'
                : 'Close treatment session'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId={`session-note-${act.id}`}>
            <Form.Label>
              {dialog === 'close' ? 'Session notes' : 'Reason'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              required
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
            />
            <Form.Text>
              {dialog === 'error'
                ? 'Explain why this entry was recorded incorrectly. Its treatment history will be retained.'
                : dialog === 'cancel'
                  ? 'Explain why this treatment is cancelled.'
                  : 'Record today’s work and what remains if treatment will continue.'}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setDialog(null)}>
            Keep editing
          </Button>
          {dialog === 'close' && (
            <Button
              variant="outline-primary"
              disabled={!note.trim()}
              onClick={() => submit('CONTINUE_LATER')}
            >
              Continue later
            </Button>
          )}
          <Button
            variant={dialog === 'close' ? 'success' : 'danger'}
            disabled={!note.trim()}
            onClick={() => submit('TREATMENT_FINISHED')}
          >
            {dialog === 'cancel'
              ? 'Cancel plan'
              : dialog === 'error'
                ? 'Mark entered in error'
                : 'Finish treatment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
