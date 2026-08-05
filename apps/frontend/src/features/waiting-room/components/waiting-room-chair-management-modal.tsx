'use client';

import Icon from '@/components/wrappers/Icon';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';

import {
  chairAvailabilityBadgeClassNames,
  getChairDisplayName,
  type WaitingRoomChair,
} from '../model';
import styles from './waiting-room-board.module.scss';

export interface WaitingRoomChairFormValues {
  code: string;
  isActive: boolean;
  name: string;
}

interface ChairEditorState extends WaitingRoomChairFormValues {
  chairId: string | null;
}

interface WaitingRoomChairManagementModalProps {
  chairs: WaitingRoomChair[];
  error?: string | null;
  isSubmitting?: boolean;
  onCreate: (values: WaitingRoomChairFormValues) => Promise<void> | void;
  onHide: () => void;
  onUpdate: (
    chair: WaitingRoomChair,
    values: WaitingRoomChairFormValues,
  ) => Promise<void> | void;
  show: boolean;
}

const emptyEditor = (): ChairEditorState => ({
  chairId: null,
  code: '',
  isActive: true,
  name: '',
});

const getChairState = (
  chair: WaitingRoomChair,
): 'available' | 'inactive' | 'occupied' => {
  if (!chair.isActive) return 'inactive';
  return chair.isAvailable ? 'available' : 'occupied';
};

const chairStateLabels = {
  available: 'Available',
  inactive: 'Inactive',
  occupied: 'Occupied',
} as const;

const WaitingRoomChairManagementModal = ({
  chairs,
  error = null,
  isSubmitting = false,
  onCreate,
  onHide,
  onUpdate,
  show,
}: WaitingRoomChairManagementModalProps) => {
  const [editor, setEditor] = useState<ChairEditorState | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const sortedChairs = useMemo(
    () =>
      [...chairs].sort(
        (left, right) =>
          Number(right.isActive) - Number(left.isActive) ||
          left.name.localeCompare(right.name),
      ),
    [chairs],
  );

  const startEditing = (chair: WaitingRoomChair) => {
    setValidationError(null);
    setEditor({
      chairId: chair.id,
      code: chair.code ?? '',
      isActive: chair.isActive,
      name: chair.name,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;

    const name = editor.name.trim();
    if (!name) {
      setValidationError('Enter a chair name.');
      return;
    }

    const values: WaitingRoomChairFormValues = {
      code: editor.code.trim(),
      isActive: editor.isActive,
      name,
    };

    setValidationError(null);
    try {
      if (editor.chairId) {
        const chair = chairs.find(
          (candidate) => candidate.id === editor.chairId,
        );
        if (!chair) return;
        await onUpdate(chair, values);
      } else {
        await onCreate(values);
      }
      setEditor(null);
    } catch {
      // The parent keeps the backend message visible and the editor recoverable.
    }
  };

  const handleAvailabilityChange = async (
    chair: WaitingRoomChair,
    isActive: boolean,
  ) => {
    setValidationError(null);
    try {
      await onUpdate(chair, {
        code: chair.code ?? '',
        isActive,
        name: chair.name,
      });
    } catch {
      // The parent keeps the backend message visible for retry.
    }
  };

  const activeCount = chairs.filter((chair) => chair.isActive).length;
  const availableCount = chairs.filter((chair) => chair.isAvailable).length;
  const occupiedCount = chairs.filter(
    (chair) => chair.isActive && !chair.isAvailable,
  ).length;
  const editedChair = editor?.chairId
    ? chairs.find((chair) => chair.id === editor.chairId)
    : null;
  const editedChairIsOccupied = Boolean(
    editedChair?.isActive && !editedChair.isAvailable,
  );

  return (
    <Modal
      centered
      onHide={isSubmitting ? undefined : onHide}
      scrollable
      show={show}
      size="lg"
    >
      <Modal.Header closeButton>
        <div>
          <Modal.Title as="h5">Manage chairs</Modal.Title>
          <p className="text-muted fs-xs mb-0 mt-1">
            Configure the clinic operatories available to the waiting room.
          </p>
        </div>
      </Modal.Header>

      <Modal.Body>
        {(error || validationError) && (
          <Alert variant="danger">{error ?? validationError}</Alert>
        )}

        <Row className="g-2 mb-3">
          {[
            { label: 'Active', value: activeCount, variant: 'primary' },
            { label: 'Available', value: availableCount, variant: 'success' },
            { label: 'Occupied', value: occupiedCount, variant: 'warning' },
          ].map((item) => (
            <Col key={item.label} xs={4}>
              <div className="border rounded p-2 text-center h-100">
                <div className={`fw-bold text-${item.variant}`}>
                  {item.value}
                </div>
                <div className="text-muted fs-xs">{item.label}</div>
              </div>
            </Col>
          ))}
        </Row>

        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div>
            <h6 className="mb-0">Clinic chairs</h6>
            <span className="text-muted fs-xs">
              Occupied chairs must be freed before deactivation.
            </span>
          </div>
          <Button
            disabled={isSubmitting || editor !== null}
            onClick={() => {
              setValidationError(null);
              setEditor(emptyEditor());
            }}
            size="sm"
            type="button"
            variant="primary"
          >
            <Icon icon="plus" className="me-1" />
            Add chair
          </Button>
        </div>

        <Table className={styles.chairManagementTable} hover responsive>
          <thead className="table-light">
            <tr>
              <th>Chair</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedChairs.map((chair) => {
              const state = getChairState(chair);
              const occupied = state === 'occupied';

              return (
                <tr key={chair.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar-sm avatar-title rounded bg-primary-subtle text-primary flex-shrink-0">
                        <Icon icon="armchair" />
                      </span>
                      <div>
                        <div className="fw-semibold">{chair.name}</div>
                        <div className="text-muted fs-xs">
                          {chair.code || 'No chair code'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge className={chairAvailabilityBadgeClassNames[state]}>
                      {chairStateLabels[state]}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex justify-content-end gap-1">
                      <Button
                        aria-label={`Edit ${getChairDisplayName(chair)}`}
                        className="btn-icon"
                        disabled={isSubmitting || editor !== null}
                        onClick={() => startEditing(chair)}
                        size="sm"
                        title={`Edit ${getChairDisplayName(chair)}`}
                        type="button"
                        variant="outline-secondary"
                      >
                        <Icon icon="square-pen" />
                      </Button>
                      <Button
                        disabled={isSubmitting || editor !== null || occupied}
                        onClick={() => {
                          void handleAvailabilityChange(chair, !chair.isActive);
                        }}
                        size="sm"
                        title={
                          occupied
                            ? 'Move or complete the seated patient before deactivating this chair.'
                            : chair.isActive
                              ? `Deactivate ${chair.name}`
                              : `Activate ${chair.name}`
                        }
                        type="button"
                        variant={
                          chair.isActive ? 'outline-danger' : 'outline-success'
                        }
                      >
                        <Icon
                          icon={chair.isActive ? 'circle-off' : 'circle-check'}
                          className="me-1"
                        />
                        {chair.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedChairs.length === 0 && (
              <tr>
                <td className="text-center text-muted py-4" colSpan={3}>
                  No chairs configured yet. Add the clinic's first chair.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {editor && (
          <Form
            className="border rounded p-3 bg-light-subtle"
            onSubmit={handleSubmit}
          >
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <h6 className="mb-0">
                {editor.chairId ? 'Edit chair' : 'Add chair'}
              </h6>
              <Button
                aria-label="Close chair editor"
                className="btn-icon"
                disabled={isSubmitting}
                onClick={() => setEditor(null)}
                size="sm"
                type="button"
                variant="ghost-secondary"
              >
                <Icon icon="x" />
              </Button>
            </div>

            <Row className="g-3">
              <Col md={7}>
                <Form.Group controlId="waiting-room-chair-name">
                  <Form.Label>Chair name</Form.Label>
                  <Form.Control
                    autoFocus
                    disabled={isSubmitting}
                    maxLength={100}
                    onChange={(event) =>
                      setEditor((current) =>
                        current
                          ? { ...current, name: event.target.value }
                          : current,
                      )
                    }
                    placeholder="e.g. Operatory 1"
                    value={editor.name}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId="waiting-room-chair-code">
                  <Form.Label>Code</Form.Label>
                  <Form.Control
                    disabled={isSubmitting}
                    maxLength={50}
                    onChange={(event) =>
                      setEditor((current) =>
                        current
                          ? { ...current, code: event.target.value }
                          : current,
                      )
                    }
                    placeholder="e.g. OP-1"
                    value={editor.code}
                  />
                </Form.Group>
              </Col>
              {editor.chairId && (
                <Col xs={12}>
                  <Form.Check
                    checked={editor.isActive}
                    disabled={isSubmitting || editedChairIsOccupied}
                    id="waiting-room-chair-active"
                    label="Chair is active and can receive patients"
                    onChange={(event) =>
                      setEditor((current) =>
                        current
                          ? { ...current, isActive: event.target.checked }
                          : current,
                      )
                    }
                    type="switch"
                  />
                  {editedChairIsOccupied && (
                    <div className="text-warning fs-xs mt-1">
                      This chair cannot be deactivated while it is occupied.
                    </div>
                  )}
                </Col>
              )}
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                disabled={isSubmitting}
                onClick={() => setEditor(null)}
                type="button"
                variant="light"
              >
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit" variant="primary">
                {isSubmitting && (
                  <Spinner animation="border" className="me-2" size="sm" />
                )}
                {editor.chairId ? 'Save chair' : 'Create chair'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button disabled={isSubmitting} onClick={onHide} variant="light">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WaitingRoomChairManagementModal;
