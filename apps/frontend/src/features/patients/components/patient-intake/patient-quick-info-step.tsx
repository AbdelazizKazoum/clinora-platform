'use client';

import { RequiredMark } from '@/components/forms';
import type { FormEvent } from 'react';
import {
  Button,
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
  type PatientQuickInfoFormModel,
  type PatientStatus,
} from '../../model';
import { formatPatientEnum } from '../../utils/patient-display';

interface PatientQuickInfoStepProps {
  form: PatientQuickInfoFormModel;
  isEditMode: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: PatientQuickInfoFormModel) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  validated: boolean;
}

const PatientQuickInfoStep = ({
  form,
  isEditMode,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  sessionStatus,
  validated,
}: PatientQuickInfoStepProps) => {
  const updateField = <TKey extends keyof PatientQuickInfoFormModel>(
    field: TKey,
    value: PatientQuickInfoFormModel[TKey],
  ) => onChange({ ...form, [field]: value });

  return (
    <Form className="pt-3" noValidate onSubmit={onSubmit} validated={validated}>
      <Row className="g-3">
        <Col md={6}>
          <FormGroup controlId="patientIntakeFirstName">
            <FormLabel>
              First name
              <RequiredMark />
            </FormLabel>
            <FormControl
              maxLength={100}
              onChange={(event) => updateField('firstName', event.target.value)}
              required
              type="text"
              value={form.firstName}
            />
            <Form.Control.Feedback type="invalid">
              First name is required.
            </Form.Control.Feedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakeLastName">
            <FormLabel>
              Last name
              <RequiredMark />
            </FormLabel>
            <FormControl
              maxLength={100}
              onChange={(event) => updateField('lastName', event.target.value)}
              required
              type="text"
              value={form.lastName}
            />
            <Form.Control.Feedback type="invalid">
              Last name is required.
            </Form.Control.Feedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakePhone">
            <FormLabel>
              Phone
              <RequiredMark />
            </FormLabel>
            <FormControl
              maxLength={30}
              onChange={(event) => updateField('phone', event.target.value)}
              required
              type="text"
              value={form.phone}
            />
            <Form.Control.Feedback type="invalid">
              Phone number is required.
            </Form.Control.Feedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakeEmail">
            <FormLabel>Email</FormLabel>
            <FormControl
              maxLength={255}
              onChange={(event) => updateField('email', event.target.value)}
              type="email"
              value={form.email}
            />
            <Form.Control.Feedback type="invalid">
              Enter a valid email address.
            </Form.Control.Feedback>
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup controlId="patientIntakeDateOfBirth">
            <FormLabel>Date of birth</FormLabel>
            <FormControl
              onChange={(event) =>
                updateField('dateOfBirth', event.target.value)
              }
              type="date"
              value={form.dateOfBirth}
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup controlId="patientIntakeGender">
            <FormLabel>
              Gender
              <RequiredMark />
            </FormLabel>
            <FormSelect
              onChange={(event) =>
                updateField('gender', event.target.value as PatientGender | '')
              }
              required
              value={form.gender}
            >
              <option value="">Select gender</option>
              {PATIENT_GENDERS.map((patientGender) => (
                <option key={patientGender} value={patientGender}>
                  {formatPatientEnum(patientGender)}
                </option>
              ))}
            </FormSelect>
            <Form.Control.Feedback type="invalid">
              Gender is required.
            </Form.Control.Feedback>
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup controlId="patientIntakeStatus">
            <FormLabel>Status</FormLabel>
            <FormSelect
              onChange={(event) =>
                updateField('status', event.target.value as PatientStatus)
              }
              value={form.status}
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
          <FormGroup controlId="patientIntakeAddress">
            <FormLabel>Address</FormLabel>
            <FormControl
              maxLength={500}
              onChange={(event) => updateField('address', event.target.value)}
              type="text"
              value={form.address}
            />
          </FormGroup>
        </Col>
      </Row>

      <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="light"
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting || sessionStatus === 'loading'}
          name="quickInfoIntent"
          type="submit"
          value="finish"
          variant="outline-primary"
        >
          {isSubmitting ? 'Saving...' : 'Save patient'}
        </Button>
        {!isEditMode && (
          <Button
            disabled={isSubmitting || sessionStatus === 'loading'}
            name="quickInfoIntent"
            type="submit"
            value="addAnother"
            variant="outline-secondary"
          >
            Save and add another
          </Button>
        )}
        <Button
          disabled={isSubmitting || sessionStatus === 'loading'}
          name="quickInfoIntent"
          type="submit"
          value="continue"
          variant="primary"
        >
          Save and continue
        </Button>
      </div>
    </Form>
  );
};

export default PatientQuickInfoStep;
