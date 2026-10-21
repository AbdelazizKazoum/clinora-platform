import { Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';

export interface ProsthesisRequirementModalProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly reason: string;
  readonly requirement: string;
  readonly actLabel: string;
}

export function ProsthesisRequirementModal({
  show,
  onClose,
  reason,
  requirement,
  actLabel,
}: ProsthesisRequirementModalProps) {
  return (
    <Modal centered show={show} onHide={onClose} size="lg">
      <ModalHeader closeButton>
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-warning bg-opacity-10 p-2 d-flex align-items-center justify-content-center">
            <Icon icon="alert-circle" className="text-warning fs-4" />
          </div>
          <h4 className="mb-0">Cannot create treatment plan</h4>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="mb-3">
          <div className="alert alert-warning mb-0" role="alert">
            <div className="d-flex gap-2">
              <Icon
                icon="alert-triangle"
                className="fs-5 flex-shrink-0 mt-1"
              />
              <div>
                <strong className="d-block mb-1">{reason}</strong>
                <p className="mb-0">{requirement}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-light">
          <div className="card-body">
            <h6 className="card-title d-flex align-items-center gap-2 mb-2">
              <Icon icon="info" className="text-primary" />
              About {actLabel}
            </h6>
            <p className="mb-2 text-muted">
              Removable dentures are prosthetic devices that replace missing
              teeth. They are designed to fill the gaps left by extracted or
              naturally missing teeth.
            </p>
            <div className="mb-0">
              <strong className="d-block mb-1">
                ✅ When can I plan a removable denture?
              </strong>
              <ul className="mb-0 text-muted">
                <li>When the tooth is already missing</li>
                <li>
                  When the tooth has been extracted (extraction wound healed)
                </li>
                <li>When planning the extraction first, then the denture</li>
              </ul>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
        >
          I understand
        </button>
      </ModalFooter>
    </Modal>
  );
}
