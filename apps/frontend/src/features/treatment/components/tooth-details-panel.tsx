'use client';
import { useState } from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormControl,
  FormLabel,
} from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import {
  ToothSurfaceSelector,
  type ToothPosition,
  type ToothSurface,
} from '@/features/odontogram';
import {
  getTreatmentCapabilityPresentation,
  type TreatmentCapabilityContext,
  type TreatmentCapabilityPresentation,
} from '../model/treatment-capabilities';
import {
  getClinicalFindingOption,
  getTreatmentActOption,
} from '../model/treatment-catalogue';
import type {
  ClinicalFinding,
  TreatmentAct,
  TreatmentActStatus,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { requiresSurface } from '../model/treatment-targets';
import {
  FindingFormFields,
  ActFormFields,
  type TreatmentEntryFieldsProps,
} from './treatment-entry-fields';
import { ActLifecycleButtons } from './treatment-act-actions';
import { ClinicalRecordDetails } from './clinical-record-details';
import styles from './treatment-workspace.module.scss';

export interface ToothDetailsPanelProps extends TreatmentEntryFieldsProps {
  readonly activeTooth: ToothPosition | null;
  readonly capabilityContext: TreatmentCapabilityContext;
  readonly selectedToothCount: number;
  readonly surfaces: readonly ToothSurface[];
  readonly findings: readonly ClinicalFinding[];
  readonly acts: readonly TreatmentAct[];
  readonly actor: MockTreatmentActor;
  readonly note: string;
  readonly onSurfacesChange: (surfaces: readonly ToothSurface[]) => void;
  readonly onNoteChange: (value: string) => void;
  readonly onAddFinding: () => void;
  readonly onAddAct: () => void;
  readonly onApproveFinding: (id: string) => void;
  readonly onApproveAct: (id: string) => void;
  readonly onTransitionAct: (id: string, status: TreatmentActStatus) => void;
}

export function ToothDetailsPanel(props: ToothDetailsPanelProps) {
  const [mode, setMode] = useState<'finding' | 'act'>('finding');
  const selectedCapability =
    mode === 'finding'
      ? props.selectedFinding?.capability
      : props.selectedAct?.capability;
  const capabilityPresentation = selectedCapability
    ? getTreatmentCapabilityPresentation(selectedCapability, {
        ...props.capabilityContext,
        subtype: mode === 'finding' ? props.findingDetail : undefined,
      })
    : 'not-available';
  const needsSurface =
    mode === 'finding'
      ? requiresSurface(props.selectedFinding?.target)
      : requiresSurface(props.selectedAct?.target);

  return (
    <Card className={styles.detailsCard}>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              {props.activeTooth
                ? `Tooth ${props.activeTooth}`
                : 'Tooth details'}
            </h5>
            <small className="text-muted">
              {props.selectedToothCount > 1
                ? `${props.selectedToothCount} teeth selected`
                : 'FDI notation'}
            </small>
          </div>
          <Badge bg="light" className="text-body">
            {props.findings.length} findings · {props.acts.length} acts
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        {props.activeTooth ? (
          <div className={styles.toothDetailsLayout}>
            <div className={styles.toothContextColumn}>
              <div className={styles.surfaceSection}>
                <div>
                  <FormLabel className="mb-1">Surfaces</FormLabel>
                  <small className="text-muted d-block">
                    Used by surface findings and direct restorations.
                  </small>
                </div>
                <ToothSurfaceSelector
                  disabled={!props.canDocument}
                  onChange={props.onSurfacesChange}
                  toothPosition={props.activeTooth}
                  value={props.surfaces}
                />
              </div>
              <ToothRecordSummary {...props} />
            </div>

            <div className={styles.toothEditorColumn}>
              <ButtonGroup className="w-100 mb-3" size="sm">
                <Button
                  onClick={() => setMode('finding')}
                  variant={mode === 'finding' ? 'primary' : 'outline-primary'}
                >
                  Chart finding
                </Button>
                <Button
                  onClick={() => setMode('act')}
                  variant={mode === 'act' ? 'primary' : 'outline-primary'}
                >
                  Plan treatment
                </Button>
              </ButtonGroup>

              <Form>
                <CapabilityStatus
                  capability={selectedCapability?.projection}
                  presentation={capabilityPresentation}
                />
                {mode === 'finding' ? (
                  <FindingFormFields {...props} />
                ) : (
                  <ActFormFields {...props} />
                )}
                {needsSurface && props.surfaces.length === 0 && (
                  <small className="text-warning d-block mb-2">
                    Select at least one surface above.
                  </small>
                )}
                <FormLabel htmlFor="treatment-entry-note">
                  Clinical note
                </FormLabel>
                <FormControl
                  as="textarea"
                  disabled={!props.canDocument}
                  id="treatment-entry-note"
                  onChange={(event) =>
                    props.onNoteChange(event.currentTarget.value)
                  }
                  placeholder="Optional rationale or observation"
                  rows={2}
                  value={props.note}
                />
                <Button
                  className="w-100 mt-3"
                  disabled={
                    !props.canDocument ||
                    capabilityPresentation === 'not-available'
                  }
                  onClick={
                    mode === 'finding' ? props.onAddFinding : props.onAddAct
                  }
                  type="button"
                >
                  <Icon
                    className="me-1"
                    icon={mode === 'finding' ? 'plus' : 'clipboard-plus'}
                  />
                  {mode === 'finding'
                    ? props.actor.role === 'doctor'
                      ? 'Confirm finding'
                      : 'Add draft finding'
                    : props.actor.role === 'doctor'
                      ? 'Plan treatment act'
                      : 'Add draft treatment act'}
                </Button>
                {capabilityPresentation === 'not-available' ? (
                  <small className="text-warning d-block text-center mt-2">
                    This clinical concept is not available for the selected
                    tooth base or dentition.
                  </small>
                ) : !props.canDocument ? (
                  <small className="text-muted d-block text-center mt-2">
                    Assistant editing requires an active documentation
                    assignment.
                  </small>
                ) : null}
              </Form>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted py-5">
            <Icon className="fs-32 mb-2" icon="mouse-pointer-click" />
            <p>Select a tooth on the odontogram.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CapabilityStatus({
  capability,
  presentation,
}: {
  readonly capability?: string;
  readonly presentation: TreatmentCapabilityPresentation;
}) {
  const label =
    presentation === 'visual'
      ? 'Visual chart support'
      : presentation === 'record-only'
        ? 'Record-only support'
        : 'Not available for this tooth';
  const variant =
    presentation === 'visual'
      ? 'success'
      : presentation === 'record-only'
        ? 'secondary'
        : 'warning';
  return (
    <div className="d-flex align-items-center justify-content-between mb-2">
      <small className="text-muted">Capability</small>
      <Badge bg={variant} title={capability}>
        {label}
      </Badge>
    </div>
  );
}

function ToothRecordSummary(props: ToothDetailsPanelProps) {
  if (props.findings.length === 0 && props.acts.length === 0) return null;
  return (
    <div className={styles.toothRecord}>
      <h6>Tooth record</h6>
      {[...props.findings, ...props.acts].map((record) => {
        const isAct = 'approvedByDentistId' in record;
        const label = isAct
          ? getTreatmentActOption(record.code)?.label
          : getClinicalFindingOption(record.code)?.label;
        return (
          <div className={styles.recordMiniRow} key={record.id}>
            <div>
              <span className="fw-semibold">{label ?? record.code}</span>
              <small className="text-muted d-block">{record.status}</small>
              <ClinicalRecordDetails
                code={record.code}
                details={record.details}
              />
            </div>
            {record.status === 'DRAFT' && props.actor.role === 'doctor' ? (
              <Button
                onClick={() =>
                  isAct
                    ? props.onApproveAct(record.id)
                    : props.onApproveFinding(record.id)
                }
                size="sm"
                variant="outline-success"
              >
                Approve
              </Button>
            ) : isAct && props.actor.role === 'doctor' ? (
              <ActLifecycleButtons
                act={record}
                onTransition={props.onTransitionAct}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
