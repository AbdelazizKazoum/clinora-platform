'use client';

import Icon from '@/components/wrappers/Icon';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ProgressBar,
} from 'react-bootstrap';

export interface FormWizardStep {
  description?: string;
  icon: string;
  id: string;
  isComplete?: boolean;
  isDisabled?: boolean;
  title: string;
}

interface FormWizardProps {
  activeStep: number;
  badge?: ReactNode;
  bodyClassName?: string;
  cardClassName?: string;
  children: ReactNode;
  onStepChange: (stepIndex: number) => void;
  steps: FormWizardStep[];
  title?: string;
  variant?: 'card' | 'plain';
}

const FormWizard = ({
  activeStep,
  badge,
  bodyClassName,
  cardClassName,
  children,
  onStepChange,
  steps,
  title,
  variant = 'card',
}: FormWizardProps) => {
  const progress =
    steps.length === 0 ? 0 : ((activeStep + 1) / steps.length) * 100;

  const wizardContent = (
    <div className="ins-wizard" data-wizard>
      <ProgressBar className="mb-3" now={progress} style={{ height: '6px' }} />

      <ul
        className="nav nav-tabs nav-justified wizard-tabs"
        data-wizard-nav
        role="tablist"
      >
        {steps.map((step, stepIndex) => (
          <li className="nav-item" key={step.id}>
            <button
              className={clsx(
                'nav-link',
                activeStep === stepIndex && 'active',
                step.isComplete &&
                  activeStep !== stepIndex &&
                  'wizard-item-done',
              )}
              disabled={step.isDisabled}
              onClick={() => onStepChange(stepIndex)}
              type="button"
            >
              <span className="d-flex align-items-center">
                <Icon icon={step.icon} className="fs-28" />
                <span className="flex-grow-1 ms-2 text-start text-truncate">
                  <span className="mb-0 lh-base d-block fw-semibold text-body fs-base">
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="fs-xxs mb-0">{step.description}</span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {children}
    </div>
  );

  if (variant === 'plain') {
    return <div className={bodyClassName}>{wizardContent}</div>;
  }

  return (
    <Card className={clsx('mx-auto', cardClassName)}>
      <CardHeader className="border-light justify-content-between py-3">
        <CardTitle as="h4" className="mb-0">
          {title}
        </CardTitle>
        {badge}
      </CardHeader>
      <CardBody className={clsx('p-3 p-md-4', bodyClassName)}>
        {wizardContent}
      </CardBody>
    </Card>
  );
};

export default FormWizard;
