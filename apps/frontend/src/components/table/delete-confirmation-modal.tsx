import type { ReactNode } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from 'react-bootstrap';

interface DeleteConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  selectedCount: number;
  confirmLabel?: string;
  itemName?: string;
  title?: string;
  children?: ReactNode;
}

const DeleteConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  selectedCount,
  confirmLabel = 'Delete',
  itemName = 'record',
  title = 'Confirm deletion',
  children,
}: DeleteConfirmationModalProps) => {
  const message =
    selectedCount > 1
      ? `Are you sure you want to delete these ${selectedCount} ${itemName}s?`
      : `Are you sure you want to delete this ${itemName}?`;

  return (
    <Modal show={show} onHide={onHide} centered>
      <ModalHeader closeButton>
        <ModalTitle as="h5">{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>{children ?? message}</ModalBody>
      <ModalFooter>
        <Button variant="light" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteConfirmationModal;
