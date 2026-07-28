'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  FormSelect,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Row,
} from 'react-bootstrap';
import {
  PATIENT_STATUSES,
  type Patient,
  type PatientStatus,
  type UpdatePatientCommand,
} from '../model';
import { formatPatientEnum } from '../utils/patient-display';

interface PatientEditModalProps {
  patient: Patient | null;
  onHide: () => void;
  onSave: (command: UpdatePatientCommand) => void;
}

const PatientEditModal = ({
  patient,
  onHide,
  onSave,
}: PatientEditModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<PatientStatus>('ACTIVE');

  useEffect(() => {
    if (!patient) return;

    setFirstName(patient.firstName);
    setLastName(patient.lastName);
    setEmail(patient.email ?? '');
    setPhone(patient.phone ?? '');
    setStatus(patient.status);
  }, [patient]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patient) return;

    onSave({
      clinicId: patient.clinicId,
      patientId: patient.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      status,
    });
  };

  return (
    <Modal show={patient !== null} onHide={onHide} size="lg">
      <ModalHeader closeButton>
        <ModalTitle as="h5">Edit patient</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <FormGroup controlId="patientFirstName">
                <FormLabel>First name</FormLabel>
                <FormControl
                  maxLength={100}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  type="text"
                  value={firstName}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup controlId="patientLastName">
                <FormLabel>Last name</FormLabel>
                <FormControl
                  maxLength={100}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  type="text"
                  value={lastName}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup controlId="patientEmail">
                <FormLabel>Email</FormLabel>
                <FormControl
                  maxLength={255}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup controlId="patientPhone">
                <FormLabel>Phone</FormLabel>
                <FormControl
                  maxLength={30}
                  onChange={(event) => setPhone(event.target.value)}
                  type="text"
                  value={phone}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup controlId="patientStatus">
                <FormLabel>Status</FormLabel>
                <FormSelect
                  onChange={(event) =>
                    setStatus(event.target.value as PatientStatus)
                  }
                  value={status}
                >
                  {PATIENT_STATUSES.map((patientStatus) => (
                    <option key={patientStatus} value={patientStatus}>
                      {formatPatientEnum(patientStatus)}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save changes
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default PatientEditModal;
