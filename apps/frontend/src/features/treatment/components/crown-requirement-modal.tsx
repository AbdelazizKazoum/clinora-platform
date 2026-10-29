import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';

export interface CrownRequirementModalProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly reason: string;
  readonly requirement: string;
}

export function CrownRequirementModal({
  show,
  onClose,
  reason,
  requirement,
}: CrownRequirementModalProps) {
  return (
    <Modal
      aria-labelledby="crown-requirement-title"
      centered
      show={show}
      onHide={onClose}
      size="lg"
    >
      <ModalHeader closeButton>
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-warning bg-opacity-10 p-2 d-flex align-items-center justify-content-center">
            <Icon icon="alert-circle" className="text-warning fs-4" />
          </div>
          <ModalTitle as="h4" id="crown-requirement-title">
            Cannot plan crown replacement
          </ModalTitle>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="alert alert-warning mb-3" role="alert">
          <div className="d-flex gap-2">
            <Icon icon="alert-triangle" className="fs-5 flex-shrink-0 mt-1" />
            <div>
              <strong className="d-block mb-1">{reason}</strong>
              <p className="mb-0">{requirement}</p>
            </div>
          </div>
        </div>
        <div className="card bg-light mb-0">
          <div className="card-body">
            <h6 className="card-title d-flex align-items-center gap-2 mb-2">
              <Icon icon="info" className="text-primary" />
              Before planning a replacement
            </h6>
            <p className="mb-0 text-muted">
              Document the existing crown and its current material on each
              affected tooth. Assistant findings require dentist confirmation.
              Then select Crown replacement and choose the new material. A
              planned first crown does not count as an existing crown.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="button" onClick={onClose}>
          I understand
        </Button>
      </ModalFooter>
    </Modal>
  );
}
