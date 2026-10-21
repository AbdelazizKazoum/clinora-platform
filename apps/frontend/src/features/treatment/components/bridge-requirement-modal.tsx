import { Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';

export interface BridgeRequirementModalProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly reason: string;
  readonly requirement: string;
}

export function BridgeRequirementModal({
  show,
  onClose,
  reason,
  requirement,
}: BridgeRequirementModalProps) {
  return (
    <Modal centered show={show} onHide={onClose} size="lg">
      <ModalHeader closeButton>
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-warning bg-opacity-10 p-2 d-flex align-items-center justify-content-center">
            <Icon icon="alert-circle" className="text-warning fs-4" />
          </div>
          <h4 className="mb-0">Cannot create fixed bridge</h4>
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
              About fixed bridges
            </h6>
            <p className="mb-2 text-muted">
              A fixed bridge is a prosthetic device that replaces one or more
              missing teeth by anchoring to adjacent natural teeth (abutments).
            </p>
            <div className="mb-3">
              <strong className="d-block mb-1">
                ✅ When can I plan a fixed bridge?
              </strong>
              <ul className="mb-0 text-muted">
                <li>At least two adjacent teeth are selected</li>
                <li>All teeth are in the same arch (upper or lower)</li>
                <li>
                  At least one tooth in the span is missing (to be replaced)
                </li>
                <li>
                  At least one natural tooth to serve as an abutment (anchor)
                </li>
                <li>Teeth form a contiguous span without gaps</li>
              </ul>
            </div>
            <div className="mb-0">
              <strong className="d-block mb-1">
                📋 How to select teeth for a bridge?
              </strong>
              <ul className="mb-0 text-muted">
                <li>
                  Hold Ctrl/Cmd and click to select multiple adjacent teeth
                </li>
                <li>
                  Include both the missing tooth/teeth and the adjacent natural
                  teeth
                </li>
                <li>
                  Example: To replace tooth 16, select teeth 15, 16, and 17
                </li>
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
