'use client';

import { useNotificationStore, usePatientStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  FormSelect,
  Row,
} from 'react-bootstrap';
import {
  PATIENT_GENDERS,
  PATIENT_STATUSES,
  type PatientGender,
  type PatientStatus,
} from '../model';
import { formatPatientEnum } from '../utils/patient-display';

const parseDateInput = (value: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00.000Z`) : undefined;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to create patient.';

const PatientCreateForm = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const createPatient = usePatientStore((state) => state.createPatient);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<PatientGender | ''>('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<PatientStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user.clinicId) {
      showNotification({
        message: 'Clinic context is required to create a patient.',
        title: 'Patient request failed',
        variant: 'danger',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createPatient({
        clinicId: session.user.clinicId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: parseDateInput(dateOfBirth),
        gender: gender || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });

      showNotification({
        message: 'Patient created successfully.',
        title: 'Patient created',
        variant: 'success',
      });
      router.push('/patients');
    } catch (error) {
      showNotification({
        message: getErrorMessage(error),
        title: 'Patient request failed',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-light">
        <h4 className="card-title mb-0">Patient information</h4>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <FormGroup controlId="newPatientFirstName">
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
              <FormGroup controlId="newPatientLastName">
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
              <FormGroup controlId="newPatientEmail">
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
              <FormGroup controlId="newPatientPhone">
                <FormLabel>Phone</FormLabel>
                <FormControl
                  maxLength={30}
                  onChange={(event) => setPhone(event.target.value)}
                  type="text"
                  value={phone}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup controlId="newPatientDateOfBirth">
                <FormLabel>Date of birth</FormLabel>
                <FormControl
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  type="date"
                  value={dateOfBirth}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup controlId="newPatientGender">
                <FormLabel>Gender</FormLabel>
                <FormSelect
                  onChange={(event) =>
                    setGender(event.target.value as PatientGender | '')
                  }
                  value={gender}
                >
                  <option value="">Not set</option>
                  {PATIENT_GENDERS.map((patientGender) => (
                    <option key={patientGender} value={patientGender}>
                      {formatPatientEnum(patientGender)}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup controlId="newPatientStatus">
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
            <Col md={12}>
              <FormGroup controlId="newPatientAddress">
                <FormLabel>Address</FormLabel>
                <FormControl
                  onChange={(event) => setAddress(event.target.value)}
                  type="text"
                  value={address}
                />
              </FormGroup>
            </Col>
            <Col md={12}>
              <FormGroup controlId="newPatientNotes">
                <FormLabel>Notes</FormLabel>
                <FormControl
                  as="textarea"
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  value={notes}
                />
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              disabled={isSubmitting}
              onClick={() => router.push('/patients')}
              type="button"
              variant="light"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || sessionStatus === 'loading'}
              type="submit"
              variant="primary"
            >
              {isSubmitting ? 'Saving...' : 'Create patient'}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default PatientCreateForm;
