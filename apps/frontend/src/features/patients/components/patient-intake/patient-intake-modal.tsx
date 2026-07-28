'use client';

import { FormWizard, type FormWizardStep } from '@/components/wizard';
import { useNotificationStore, usePatientStore } from '@/store';
import { useSession } from 'next-auth/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Modal, ModalBody, ModalHeader, ModalTitle } from 'react-bootstrap';
import {
  createEmptyPatientMedicalAlertsForm,
  createEmptyPatientQuickInfoForm,
  mapMedicalAlertsFormToUpdateCommand,
  mapPatientToMedicalAlertsForm,
  mapPatientToQuickInfoForm,
  mapQuickInfoFormToCreateCommand,
  mapQuickInfoFormToUpdateCommand,
  type Patient,
  type PatientMedicalAlertsFormModel,
  type PatientQuickInfoFormModel,
} from '../../model';
import PatientMedicalAlertsStep from './patient-medical-alerts-step';
import PatientQuickInfoStep from './patient-quick-info-step';

type IntakeStep = 0 | 1;
type QuickInfoSubmitIntent = 'finish' | 'addAnother' | 'continue';

interface PatientIntakeModalProps {
  onHide: () => void;
  onSaved: () => Promise<void> | void;
  patient: Patient | null;
  show: boolean;
}

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

const PatientIntakeModal = ({
  onHide,
  onSaved,
  patient,
  show,
}: PatientIntakeModalProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const createPatient = usePatientStore((state) => state.createPatient);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const isEditMode = patient !== null;
  const [activeStep, setActiveStep] = useState<IntakeStep>(0);
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!show) return;

    setActiveStep(0);
    setSavedPatientId(patient?.id ?? null);
    setQuickInfo(
      patient
        ? mapPatientToQuickInfoForm(patient)
        : createEmptyPatientQuickInfoForm(),
    );
    setMedicalAlerts(
      patient
        ? mapPatientToMedicalAlertsForm(patient)
        : createEmptyPatientMedicalAlertsForm(),
    );
    setQuickInfoValidated(false);
    setMedicalAlertsValidated(false);
  }, [patient, show]);

  const resetCreateFlow = () => {
    setActiveStep(0);
    setSavedPatientId(null);
    setQuickInfo(createEmptyPatientQuickInfoForm());
    setMedicalAlerts(createEmptyPatientMedicalAlertsForm());
    setQuickInfoValidated(false);
    setMedicalAlertsValidated(false);
  };

  const requireClinicId = (): string | null => {
    const clinicId = patient?.clinicId ?? session?.user.clinicId;
    if (clinicId) return clinicId;

    showNotification({
      message: 'Clinic context is required to save a patient.',
      title: 'Patient request failed',
      variant: 'danger',
    });

    return null;
  };

  const handleStepChange = (stepIndex: number) => {
    setActiveStep(stepIndex === 1 ? 1 : 0);
  };

  const handleClose = () => {
    if (isSubmitting) return;

    onHide();
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
      const savedPatient = savedPatientId
        ? await updatePatient(
            mapQuickInfoFormToUpdateCommand(
              clinicId,
              savedPatientId,
              quickInfo,
            ),
          )
        : await createPatient(
            mapQuickInfoFormToCreateCommand(clinicId, quickInfo),
          );

      setSavedPatientId(savedPatient.id);
      setQuickInfoValidated(true);
      await onSaved();

      if (intent === 'finish') {
        showNotification({
          message: isEditMode
            ? 'Patient quick info updated successfully.'
            : 'Patient quick info saved successfully.',
          title: 'Patient saved',
          variant: 'success',
        });
        onHide();
        return;
      }

      if (intent === 'addAnother') {
        showNotification({
          message: 'Patient saved. The form is ready for the next patient.',
          title: 'Patient saved',
          variant: 'success',
        });
        resetCreateFlow();
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

    if (!savedPatientId) {
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
        mapMedicalAlertsFormToUpdateCommand(
          clinicId,
          savedPatientId,
          medicalAlerts,
        ),
      );
      setMedicalAlertsValidated(true);
      await onSaved();
      showNotification({
        message: 'Medical alerts saved successfully.',
        title: 'Patient saved',
        variant: 'success',
      });
      onHide();
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
        'Medical alerts skipped. They can be completed from the patient profile.',
      title: 'Patient saved',
      variant: 'info',
    });
    onHide();
  };

  const steps: FormWizardStep[] = [
    {
      description: 'Required patient details',
      icon: 'circle-user-round',
      id: 'quick-info',
      isComplete: savedPatientId !== null,
      title: 'Quick Info',
    },
    {
      description: 'Optional safety notes',
      icon: 'heart-pulse',
      id: 'medical-alerts',
      isDisabled: savedPatientId === null,
      title: 'Medical Alerts',
    },
  ];

  return (
    <Modal show={show} onHide={handleClose} centered scrollable size="xl">
      <ModalHeader closeButton>
        <ModalTitle as="h5">
          {isEditMode ? 'Edit patient' : 'New patient'}
        </ModalTitle>
        {savedPatientId && (
          <span className="badge badge-soft-success badge-label fs-xxs py-1 ms-2">
            Patient saved
          </span>
        )}
      </ModalHeader>
      <ModalBody className="p-3 p-md-4">
        <FormWizard
          activeStep={activeStep}
          onStepChange={handleStepChange}
          steps={steps}
          variant="plain"
        >
          {activeStep === 0 ? (
            <PatientQuickInfoStep
              form={quickInfo}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onCancel={handleClose}
              onChange={setQuickInfo}
              onSubmit={handleQuickInfoSubmit}
              sessionStatus={sessionStatus}
              validated={quickInfoValidated}
            />
          ) : (
            <PatientMedicalAlertsStep
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
      </ModalBody>
    </Modal>
  );
};

export default PatientIntakeModal;
