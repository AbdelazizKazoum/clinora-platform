'use client';

import type { FormEvent } from 'react';
import {
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  Row,
} from 'react-bootstrap';
import type { PatientMedicalAlertsFormModel } from '../../model';

interface PatientMedicalAlertsStepProps {
  form: PatientMedicalAlertsFormModel;
  isSubmitting: boolean;
  onBack: () => void;
  onChange: (form: PatientMedicalAlertsFormModel) => void;
  onSkip: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  validated: boolean;
}

const PatientMedicalAlertsStep = ({
  form,
  isSubmitting,
  onBack,
  onChange,
  onSkip,
  onSubmit,
  validated,
}: PatientMedicalAlertsStepProps) => {
  const updateField = <TKey extends keyof PatientMedicalAlertsFormModel>(
    field: TKey,
    value: PatientMedicalAlertsFormModel[TKey],
  ) => onChange({ ...form, [field]: value });

  return (
    <Form className="pt-3" noValidate onSubmit={onSubmit} validated={validated}>
      <Row className="g-3">
        <Col md={6}>
          <FormGroup controlId="patientIntakeAllergies">
            <FormLabel>Allergies</FormLabel>
            <FormControl
              as="textarea"
              onChange={(event) => updateField('allergies', event.target.value)}
              rows={3}
              value={form.allergies}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakeChronicConditions">
            <FormLabel>Chronic conditions</FormLabel>
            <FormControl
              as="textarea"
              onChange={(event) =>
                updateField('chronicConditions', event.target.value)
              }
              rows={3}
              value={form.chronicConditions}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakeCurrentMedications">
            <FormLabel>Current medications</FormLabel>
            <FormControl
              as="textarea"
              onChange={(event) =>
                updateField('currentMedications', event.target.value)
              }
              rows={3}
              value={form.currentMedications}
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup controlId="patientIntakeMedicalNotes">
            <FormLabel>Medical notes</FormLabel>
            <FormControl
              as="textarea"
              onChange={(event) =>
                updateField('medicalNotes', event.target.value)
              }
              rows={3}
              value={form.medicalNotes}
            />
          </FormGroup>
        </Col>
      </Row>

      <div className="d-flex flex-wrap justify-content-between gap-2 mt-4">
        <Button
          disabled={isSubmitting}
          onClick={onBack}
          type="button"
          variant="light"
        >
          Back
        </Button>
        <div className="d-flex flex-wrap gap-2">
          <Button
            disabled={isSubmitting}
            onClick={onSkip}
            type="button"
            variant="outline-secondary"
          >
            Skip for now
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? 'Saving...' : 'Save medical alerts'}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default PatientMedicalAlertsStep;
