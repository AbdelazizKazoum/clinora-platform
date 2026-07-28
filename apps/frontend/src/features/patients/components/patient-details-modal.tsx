import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Row,
} from 'react-bootstrap';
import type { Patient } from '../model';
import { formatPatientDate, formatPatientEnum } from '../utils/patient-display';

interface PatientDetailsModalProps {
  patient: Patient | null;
  onHide: () => void;
}

const PatientDetailsModal = ({ patient, onHide }: PatientDetailsModalProps) => (
  <Modal show={patient !== null} onHide={onHide} centered size="lg">
    <ModalHeader closeButton>
      <ModalTitle as="h5">Patient details</ModalTitle>
    </ModalHeader>
    <ModalBody>
      {patient && (
        <Row className="g-3">
          <PatientDetail label="First name" value={patient.firstName} />
          <PatientDetail label="Last name" value={patient.lastName} />
          <PatientDetail label="Email" value={patient.email ?? '—'} />
          <PatientDetail label="Phone" value={patient.phone ?? '—'} />
          <PatientDetail
            label="Date of birth"
            value={formatPatientDate(patient.dateOfBirth)}
          />
          <PatientDetail
            label="Gender"
            value={patient.gender ? formatPatientEnum(patient.gender) : '—'}
          />
          <PatientDetail label="Address" value={patient.address ?? '—'} />
          <PatientDetail
            label="Status"
            value={formatPatientEnum(patient.status)}
          />
        </Row>
      )}
    </ModalBody>
    <ModalFooter>
      <Button variant="light" onClick={onHide}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
);

const PatientDetail = ({ label, value }: { label: string; value: string }) => (
  <Col md={6}>
    <span className="text-muted fs-xs">{label}</span>
    <p className="mb-0 fw-semibold">{value}</p>
  </Col>
);

export default PatientDetailsModal;
