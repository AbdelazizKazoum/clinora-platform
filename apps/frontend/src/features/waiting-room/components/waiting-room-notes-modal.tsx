'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

import type { WaitingRoomEntry } from '../model';
import WaitingRoomIconAvatar from './waiting-room-icon-avatar';

interface WaitingRoomNotesModalProps {
  entry: WaitingRoomEntry;
  error?: string | null;
  isSubmitting?: boolean;
  onHide: () => void;
  onSubmit: (notes: string | null) => Promise<void> | void;
  show: boolean;
}

const WaitingRoomNotesModal = ({
  entry,
  error = null,
  isSubmitting = false,
  onHide,
  onSubmit,
  show,
}: WaitingRoomNotesModalProps) => {
  const [notes, setNotes] = useState(entry.queueNotes ?? '');

  useEffect(() => {
    if (show) {
      setNotes(entry.queueNotes ?? '');
    }
  }, [entry.id, entry.queueNotes, show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedNotes = notes.trim();

    await onSubmit(normalizedNotes || null);
  };

  return (
    <Modal centered onHide={isSubmitting ? undefined : onHide} show={show}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Queue notes</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="d-flex align-items-center gap-2 mb-3">
            <WaitingRoomIconAvatar icon="notebook-pen" variant="warning" />
            <div className="min-w-0">
              <p className="fw-semibold text-truncate mb-0">
                {entry.patientName}
              </p>
              <p className="text-muted fs-xs mb-0">
                Visible to clinic staff working with today&apos;s queue.
              </p>
            </div>
          </div>

          <Form.Group controlId="waiting-room-notes">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              autoFocus
              disabled={isSubmitting}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add operational notes for this visit..."
              rows={5}
              value={notes}
            />
            <Form.Text>
              Leave this empty to remove the current queue note.
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={isSubmitting} onClick={onHide} variant="light">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting && (
              <Spinner animation="border" className="me-2" size="sm" />
            )}
            Save notes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WaitingRoomNotesModal;
