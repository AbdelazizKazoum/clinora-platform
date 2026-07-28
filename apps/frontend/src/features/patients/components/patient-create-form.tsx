'use client';

import { RequiredMark } from '@/components/forms';
import { FormWizard, type FormWizardStep } from '@/components/wizard';
import { useNotificationStore, usePatientStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, type FormEvent } from 'react';
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
  createEmptyPatientMedicalAlertsForm,
  createEmptyPatientQuickInfoForm,
  mapMedicalAlertsFormToUpdateCommand,
  mapQuickInfoFormToCreateCommand,
  mapQuickInfoFormToUpdateCommand,
  PATIENT_GENDERS,
  PATIENT_STATUSES,
  type PatientGender,
  type PatientMedicalAlertsFormModel,
  type PatientQuickInfoFormModel,
  type PatientStatus,
} from '../model';
import { formatPatientEnum } from '../utils/patient-display';

type IntakeStep = 0 | 1;
type QuickInfoSubmitIntent = 'finish' | 'addAnother' | 'continue';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to save patient.';

const isQuickInfoSubmitIntent = (
  value: string,
): value is QuickInfoSubmitIntent =>
  value === 'finish' || value === 'addAnother' || value === 'continue';

const getQuickInfoSubmitIntent = (
  event: FormEvent<HTMLFormElement>,
): QuickInfoSubmitIntent => {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;

  if (
    submitter instanceof HTMLButtonElement &&
    isQuickInfoSubmitIntent(submitter.value)
  ) {
    return submitter.value;
  }

  return 'continue';
};

const PatientCreateForm = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const createPatient = usePatientStore((state) => state.createPatient);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [activeStep, setActiveStep] = useState<IntakeStep>(0);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [quickInfo, setQuickInfo] = useState<PatientQuickInfoFormModel>(
    createEmptyPatientQuickInfoForm,
  );
  const [medicalAlerts, setMedicalAlerts] =
    useState<PatientMedicalAlertsFormModel>(
      createEmptyPatientMedicalAlertsForm,
    );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickInfoValidated, setQuickInfoValidated] = useState(false);
  const [medicalAlertsValidated, setMedicalAlertsValidated] = useState(false);

  const resetFlow = () => {
    setPatientId(null);
    setActiveStep(0);
    setQuickInfo(createEmptyPatientQuickInfoForm());
    setMedicalAlerts(createEmptyPatientMedicalAlertsForm());
    setQuickInfoValidated(false);
    setMedicalAlertsValidated(false);
  };

  const requireClinicId = (): string | null => {
    if (session?.user.clinicId) return session.user.clinicId;

    showNotification({
      message: 'Clinic context is required to save a patient.',
      title: 'Patient request failed',
      variant: 'danger',
    });

    return null;
  };

  const handleQuickInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
      setQuickInfoValidated(true);
      return;
    }

    const clinicId = requireClinicId();
    if (!clinicId) return;

    const intent = getQuickInfoSubmitIntent(event);

    try {
      setIsSubmitting(true);
      const patient = patientId
        ? await updatePatient(
            mapQuickInfoFormToUpdateCommand(clinicId, patientId, quickInfo),
          )
        : await createPatient(
            mapQuickInfoFormToCreateCommand(clinicId, quickInfo),
          );

      setPatientId(patient.id);
      setQuickInfoValidated(true);

      if (intent === 'finish') {
        showNotification({
          message: 'Patient quick info saved successfully.',
          title: 'Patient saved',
          variant: 'success',
        });
        router.push('/patients');
        return;
      }

      if (intent === 'addAnother') {
        showNotification({
          message: 'Patient saved. The form is ready for the next patient.',
          title: 'Patient saved',
          variant: 'success',
        });
        resetFlow();
        return;
      }

      showNotification({
        message: 'Quick info saved. You can add medical alerts now.',
        title: 'Patient saved',
        variant: 'success',
      });
      setActiveStep(1);
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

  const handleMedicalAlertsSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
      setMedicalAlertsValidated(true);
      return;
    }

    const clinicId = requireClinicId();
    if (!clinicId) return;

    if (!patientId) {
      showNotification({
        message: 'Save quick info before adding medical alerts.',
        title: 'Patient request failed',
        variant: 'warning',
      });
      setActiveStep(0);
      return;
    }

    try {
      setIsSubmitting(true);
      await updatePatient(
        mapMedicalAlertsFormToUpdateCommand(clinicId, patientId, medicalAlerts),
      );
      setMedicalAlertsValidated(true);
      showNotification({
        message: 'Medical alerts saved successfully.',
        title: 'Patient saved',
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

  const handleSkipMedicalAlerts = () => {
    showNotification({
      message:
        'Medical alerts skipped. They can be completed from the profile.',
      title: 'Patient saved',
      variant: 'info',
    });
    router.push('/patients');
  };

  const steps: FormWizardStep[] = [
    {
      description: 'Required patient details',
      icon: 'circle-user-round',
      id: 'quick-info',
      isComplete: patientId !== null,
      title: 'Quick Info',
    },
    {
      description: 'Optional safety notes',
      icon: 'heart-pulse',
      id: 'medical-alerts',
      isDisabled: patientId === null,
      title: 'Medical Alerts',
    },
  ];

  const handleStepChange = (stepIndex: number) => {
    setActiveStep(stepIndex === 1 ? 1 : 0);
  };

  return (
    <FormWizard
      activeStep={activeStep}
      badge={
        patientId ? (
          <span className="badge badge-soft-success badge-label fs-xxs py-1">
            Patient saved
          </span>
        ) : undefined
      }
      onStepChange={handleStepChange}
      steps={steps}
      title="Patient intake"
    >
      {activeStep === 0 ? (
        <QuickInfoStep
          form={quickInfo}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/patients')}
          onChange={setQuickInfo}
          onSubmit={handleQuickInfoSubmit}
          sessionStatus={sessionStatus}
          validated={quickInfoValidated}
        />
      ) : (
        <MedicalAlertsStep
          form={medicalAlerts}
          isSubmitting={isSubmitting}
          onBack={() => setActiveStep(0)}
          onChange={setMedicalAlerts}
          onSkip={handleSkipMedicalAlerts}
          onSubmit={handleMedicalAlertsSubmit}
          validated={medicalAlertsValidated}
        />
      )}
    </FormWizard>
  );
};

interface QuickInfoStepProps {
  form: PatientQuickInfoFormModel;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: PatientQuickInfoFormModel) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  validated: boolean;
}

const QuickInfoStep = ({
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  sessionStatus,
  validated,
}: QuickInfoStepProps) => {
  const updateField = <TKey extends keyof PatientQuickInfoFormModel>(
    field: TKey,
    value: PatientQuickInfoFormModel[TKey],
  ) => onChange({ ...form, [field]: value });

  return (
    <Form className="pt-3" noValidate onSubmit={onSubmit} validated={validated}>
      <Row className="g-3">
        <Col md={6}>
          <FormGroup controlId="newPatientFirstName">
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
          <FormGroup controlId="newPatientLastName">
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
          <FormGroup controlId="newPatientPhone">
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
          <FormGroup controlId="newPatientEmail">
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
          <FormGroup controlId="newPatientDateOfBirth">
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
          <FormGroup controlId="newPatientGender">
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
          <FormGroup controlId="newPatientStatus">
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
          <FormGroup controlId="newPatientAddress">
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
        <Button
          disabled={isSubmitting || sessionStatus === 'loading'}
          name="quickInfoIntent"
          type="submit"
          value="addAnother"
          variant="outline-secondary"
        >
          Save and add another
        </Button>
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

interface MedicalAlertsStepProps {
  form: PatientMedicalAlertsFormModel;
  isSubmitting: boolean;
  onBack: () => void;
  onChange: (form: PatientMedicalAlertsFormModel) => void;
  onSkip: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  validated: boolean;
}

const MedicalAlertsStep = ({
  form,
  isSubmitting,
  onBack,
  onChange,
  onSkip,
  onSubmit,
  validated,
}: MedicalAlertsStepProps) => {
  const updateField = <TKey extends keyof PatientMedicalAlertsFormModel>(
    field: TKey,
    value: PatientMedicalAlertsFormModel[TKey],
  ) => onChange({ ...form, [field]: value });

  return (
    <Form className="pt-3" noValidate onSubmit={onSubmit} validated={validated}>
      <Row className="g-3">
        <Col md={6}>
          <FormGroup controlId="newPatientAllergies">
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
          <FormGroup controlId="newPatientChronicConditions">
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
          <FormGroup controlId="newPatientCurrentMedications">
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
          <FormGroup controlId="newPatientMedicalNotes">
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

export default PatientCreateForm;
