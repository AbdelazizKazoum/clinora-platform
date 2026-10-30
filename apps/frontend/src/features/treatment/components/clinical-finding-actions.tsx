'use client';

import { useState } from 'react';
import { Button, FormControl, FormLabel } from 'react-bootstrap';
import DeleteConfirmationModal from '@/components/table/delete-confirmation-modal';
import Icon from '@/components/wrappers/Icon';
import type { ClinicalFinding } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';

export function ClinicalFindingActions({
  finding,
  onRemove,
  canRemove,
}: {
  readonly actor: MockTreatmentActor;
  readonly finding: ClinicalFinding;
  readonly onRemove: (id: string, reason?: string) => void;
  readonly canRemove: boolean;
}) {
  const [showRemovalConfirmation, setShowRemovalConfirmation] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const requiresReason = finding.status === 'CONFIRMED';

  const closeRemovalConfirmation = () => {
    setShowRemovalConfirmation(false);
    setReason('');
    setReasonError(false);
  };

  const confirmRemoval = () => {
    const trimmedReason = reason.trim();
    if (requiresReason && !trimmedReason) {
      setReasonError(true);
      return;
    }
    onRemove(finding.id, trimmedReason || undefined);
    closeRemovalConfirmation();
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-center gap-1">
        {canRemove && (
          <Button
            aria-label={`Remove ${finding.code} finding`}
            size="sm"
            title="Remove finding"
            variant="outline-danger"
            onClick={() => setShowRemovalConfirmation(true)}
          >
            <Icon icon="trash-2" className="me-1" />
            Remove
          </Button>
        )}
      </div>
      <DeleteConfirmationModal
        show={showRemovalConfirmation}
        onHide={closeRemovalConfirmation}
        onConfirm={confirmRemoval}
        selectedCount={1}
        confirmLabel="Remove"
        itemName="clinical finding"
        title="Remove clinical finding"
      >
        {requiresReason ? (
          <div>
            <p>
              This confirmed finding will be marked as entered in error and
              removed from the active chart. The audit history will be kept.
            </p>
            <FormLabel htmlFor={`finding-removal-reason-${finding.id}`}>
              Reason
            </FormLabel>
            <FormControl
              as="textarea"
              id={`finding-removal-reason-${finding.id}`}
              isInvalid={reasonError}
              onChange={(event) => {
                setReason(event.currentTarget.value);
                setReasonError(false);
              }}
              placeholder="Explain why this finding is being removed"
              rows={3}
              value={reason}
            />
            {reasonError && (
              <small className="text-danger">
                A reason is required for a confirmed finding.
              </small>
            )}
          </div>
        ) : (
          'This draft finding will be removed from the visit.'
        )}
      </DeleteConfirmationModal>
    </>
  );
}
