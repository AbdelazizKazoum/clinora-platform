'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import {
  Odontogram,
  ToothSurfaceSelector,
  TOOTH_POSITIONS,
  type OdontogramSelection,
  type ToothPosition,
  type ToothSurface,
} from '@/features/odontogram';
import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormControl,
  FormLabel,
  FormSelect,
  Nav,
  Row,
  Stack,
} from 'react-bootstrap';

import {
  MOCK_ASSISTANT,
  MOCK_DENTIST,
  MOCK_TREATMENT_PATIENT,
  createMockTreatmentVisit,
} from '../mock/treatment-workspace.mock';
import {
  CLINICAL_FINDING_OPTIONS,
  TREATMENT_ACT_OPTIONS,
  getClinicalFindingOption,
  getTreatmentActOption,
  type TreatmentCatalogueTarget,
} from '../model/treatment-catalogue';
import {
  getTreatmentCapabilityPresentation,
  type TreatmentCapabilityContext,
  type TreatmentCapabilityPresentation,
} from '../model/treatment-capabilities';
import { mapTreatmentVisitToOdontogram } from '../model/treatment-odontogram.mapper';
import {
  createTreatmentActInput,
  createTreatmentFindingInput,
} from '../model/treatment-inputs';
import {
  approveWorkspaceAct,
  approveWorkspaceFinding,
  assignWorkspaceDocumentation,
  completeWorkspaceVisit,
  recordWorkspaceAct,
  recordWorkspaceFinding,
  reviewWorkspaceDocumentation,
  startWorkspaceDocumentation,
  submitWorkspaceDocumentation,
  transitionWorkspaceAct,
  type MockTreatmentActor,
} from '../model/treatment-workspace';
import {
  documentationHandoffStatusLabels,
  treatmentVisitStatusLabels,
  type ClinicalDetail,
  type ClinicalFinding,
  type ClinicalFindingCode,
  type PeriodontalSite,
  type ToothSurface as TreatmentSurface,
  type TreatmentAct,
  type TreatmentActCode,
  type TreatmentActStatus,
  type TreatmentLaunchContext,
  type TreatmentVisit,
} from '../model/treatment';
import styles from '../components/treatment-workspace.module.scss';

const PeriodontalWorkspace = dynamic(
  () =>
    import('../components/periodontal-workspace').then(
      ({ PeriodontalWorkspace: component }) => component,
    ),
  {
    loading: () => <div role="status">Loading periodontal workspace...</div>,
    ssr: false,
  },
);

export interface TreatmentWorkspacePageProps {
  readonly launchContext?: TreatmentLaunchContext | null;
}

type WorkspaceTab = 'chart' | 'periodontal' | 'record' | 'handoff';

const FILLING_MATERIALS = [
  ['COMPOSITE', 'Composite'],
  ['AMALGAM', 'Amalgam'],
  ['GIC', 'Glass ionomer'],
  ['TEMPORARY', 'Temporary'],
] as const;

const RESTORATION_MATERIALS = [
  ['ZIRCON', 'Zirconia'],
  ['EMAX', 'Lithium disilicate (e.max)'],
  ['METAL_CERAMIC', 'Metal-ceramic'],
  ['METAL', 'Full-cast metal'],
  ['GOLD', 'Gold'],
  ['GRADIA', 'Indirect composite'],
  ['TELESCOPE', 'Telescope'],
  ['TEMPORARY', 'Temporary'],
] as const;

const PARTIAL_RESTORATION_MATERIALS = RESTORATION_MATERIALS.filter(([value]) =>
  ['ZIRCON', 'EMAX', 'GOLD', 'GRADIA', 'TEMPORARY'].includes(value),
);

const PERIODONTAL_SITE_OPTIONS: readonly PeriodontalSite[] = [
  'MB',
  'B',
  'DB',
  'ML',
  'L',
  'DL',
];

export function TreatmentWorkspacePage({
  launchContext,
}: TreatmentWorkspacePageProps) {
  const demoDentist: MockTreatmentActor = {
    ...MOCK_DENTIST,
    userId: launchContext?.doctorId ?? MOCK_DENTIST.userId,
  };
  const [visit, setVisit] = useState<TreatmentVisit>(() =>
    createMockTreatmentVisit({
      appointmentId: launchContext?.appointmentId ?? undefined,
      chairId: launchContext?.chairId ?? undefined,
      doctorId: launchContext?.doctorId ?? undefined,
      patientId: launchContext?.patientId ?? undefined,
      queueEntryId: launchContext?.queueEntryId ?? undefined,
    }),
  );
  const [selection, setSelection] = useState<OdontogramSelection>({
    activeToothPosition: 16,
    selectedToothPositions: [16],
  });
  const [surfaces, setSurfaces] = useState<readonly ToothSurface[]>([
    'occlusal',
  ]);
  const [actor, setActor] = useState<MockTreatmentActor>(demoDentist);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chart');
  const [findingCode, setFindingCode] = useState<ClinicalFindingCode>('CARIES');
  const [findingSearch, setFindingSearch] = useState('');
  const [findingDetail, setFindingDetail] = useState('4');
  const [findingAdditionalDetail, setFindingAdditionalDetail] = useState('');
  const [periodontalSite, setPeriodontalSite] = useState<PeriodontalSite>('B');
  const [actCode, setActCode] = useState<TreatmentActCode>('DIRECT_FILLING');
  const [actSearch, setActSearch] = useState('');
  const [fillingMaterial, setFillingMaterial] = useState('COMPOSITE');
  const [restorationMaterial, setRestorationMaterial] = useState('ZIRCON');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{
    readonly message: string;
    readonly variant: 'success' | 'warning' | 'danger' | 'info';
  } | null>({
    message:
      'Demo mode: all changes are local and reset when the page reloads.',
    variant: 'info',
  });
  const idCounter = useRef(1);

  const projection = useMemo(
    () => mapTreatmentVisitToOdontogram(visit),
    [visit],
  );
  const activeTooth = selection.activeToothPosition;
  const activeToothVisual = projection.data.teeth.find(
    (tooth) => tooth.position === activeTooth,
  );
  const activeToothFindings = visit.findings.filter((finding) =>
    activeTooth ? finding.target.toothNumbers.includes(activeTooth) : false,
  );
  const activeToothActs = visit.acts.filter((act) =>
    activeTooth ? act.target.toothNumbers.includes(activeTooth) : false,
  );
  const selectedFinding = getClinicalFindingOption(findingCode);
  const selectedAct = getTreatmentActOption(actCode);
  const canDocument = canCurrentActorDocument(visit, actor);
  const isReadOnly =
    visit.status === 'COMPLETED' || visit.status === 'CANCELLED';

  const nextId = (prefix: string) => {
    const id = `${prefix}-mock-${idCounter.current}`;
    idCounter.current += 1;
    return id;
  };

  const runAction = (action: () => TreatmentVisit, success: string) => {
    try {
      setVisit(action());
      setFeedback({ message: success, variant: 'success' });
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update the visit.',
        variant: 'danger',
      });
    }
  };

  const addFinding = () => {
    if (!activeTooth || !selectedFinding) {
      return setFeedback({
        message: 'Select a tooth first.',
        variant: 'warning',
      });
    }
    if (requiresSurface(selectedFinding.target) && surfaces.length === 0) {
      return setFeedback({
        message: 'Select at least one tooth surface.',
        variant: 'warning',
      });
    }

    const details: ClinicalDetail[] = [];
    if (selectedFinding.detailKey && findingDetail) {
      details.push({ key: selectedFinding.detailKey, value: findingDetail });
    }
    if (selectedFinding.numericDetail) {
      details.push({
        key: selectedFinding.numericDetail.key,
        value: Number(findingDetail),
      });
    }
    if (findingCode === 'EXISTING_FIXED_RESTORATION') {
      details.push({ key: 'RESTORATION_MATERIAL', value: restorationMaterial });
    }
    if (selectedFinding.additionalDetailKey && findingAdditionalDetail) {
      details.push({ key: selectedFinding.additionalDetailKey, value: findingAdditionalDetail });
    }

    runAction(
      () =>
        recordWorkspaceFinding(
          visit,
          actor,
            createTreatmentFindingInput({
              code: findingCode,
              details,
              id: nextId('finding'),
              note: note.trim() || null,
              target: buildTarget(
                selectedFinding.target,
                [activeTooth],
                surfaces,
                periodontalSite,
              ),
            }),
          new Date(),
        ),
      actor.role === 'doctor'
        ? 'Clinical finding confirmed and added to the chart.'
        : 'Draft finding added for dentist review.',
    );
    setNote('');
  };

  const addAct = () => {
    if (!selectedAct || selection.selectedToothPositions.length === 0) {
      return setFeedback({
        message: 'Select the target tooth or teeth first.',
        variant: 'warning',
      });
    }
    if (requiresSurface(selectedAct.target) && surfaces.length === 0) {
      return setFeedback({
        message: 'Select at least one tooth surface.',
        variant: 'warning',
      });
    }
    if (selectedAct.target === 'bridge') {
      const bridgeError = validateBridgeSelection(
        selection.selectedToothPositions,
        projection.data,
      );
      if (bridgeError)
        return setFeedback({ message: bridgeError, variant: 'warning' });
    }

    const details: ClinicalDetail[] = [];
    if (selectedAct.requiresMaterial === 'filling') {
      details.push({ key: 'FILLING_MATERIAL', value: fillingMaterial });
    }
    if (selectedAct.requiresMaterial === 'restoration') {
      details.push({ key: 'RESTORATION_MATERIAL', value: restorationMaterial });
    }

    runAction(
      () =>
        recordWorkspaceAct(
          visit,
          actor,
            createTreatmentActInput({
              code: actCode,
              details,
              id: nextId('act'),
              note: note.trim() || null,
              target: buildTarget(
                selectedAct.target,
                selection.selectedToothPositions,
                surfaces,
                periodontalSite,
              ),
            }),
          new Date(),
        ),
      actor.role === 'doctor'
        ? 'Treatment act planned and projected on the odontogram where supported.'
        : 'Draft treatment act added for dentist approval.',
    );
    setNote('');
  };

  const selectFindingCode = (code: ClinicalFindingCode) => {
    setFindingCode(code);
    setFindingSearch('');
    const option = getClinicalFindingOption(code);
    setFindingDetail(
      option?.numericDetail
        ? String(option.numericDetail.min)
        : (option?.detailOptions?.[0]?.value ?? ''),
    );
    setFindingAdditionalDetail(option?.additionalDetailOptions?.[0]?.value ?? '');
  };

  const selectFindingDetail = (value: string) => {
    setFindingDetail(value);
    if (
      findingCode === 'EXISTING_FIXED_RESTORATION' &&
      value !== 'CROWN' &&
      !isPartialRestorationMaterial(restorationMaterial)
    ) {
      setRestorationMaterial('ZIRCON');
    }
  };

  const selectActCode = (code: TreatmentActCode) => {
    setActCode(code);
    setActSearch('');
    if (
      isPartialRestoration(code) &&
      !isPartialRestorationMaterial(restorationMaterial)
    ) {
      setRestorationMaterial('ZIRCON');
    }
  };

  return (
    <div className={styles.workspace}>
      <PageBreadcrumb title="Treatment workspace" subtitle="Visits" />

      <PatientVisitHeader
        actor={actor}
        dentist={demoDentist}
        onActorChange={setActor}
        visit={visit}
      />

      {feedback && (
        <Alert
          className="d-flex align-items-center justify-content-between py-2"
          dismissible
          onClose={() => setFeedback(null)}
          variant={feedback.variant}
        >
          <span>{feedback.message}</span>
        </Alert>
      )}

      <Nav className={`${styles.workspaceTabs} nav-tabs mb-3`}>
        {(
          [
            ['chart', 'Odontogram & tooth details', 'scan-line'],
            ['periodontal', 'Periodontal chart', 'activity'],
            ['record', 'Clinical record', 'clipboard-list'],
            ['handoff', 'Documentation handoff', 'users-round'],
          ] as const
        ).map(([tab, label, icon]) => (
          <Nav.Item key={tab}>
            <Nav.Link
              active={activeTab === tab}
              as="button"
              onClick={() => setActiveTab(tab)}
            >
              <Icon className="me-1" icon={icon} /> {label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {activeTab === 'chart' && (
        <Row className="g-3">
          <Col className={styles.chartColumn}>
            <Card className={styles.chartCard}>
              <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h5 className="mb-1">Clinical odontogram</h5>
                  <p className="text-muted mb-0 fs-sm">
                    Click a tooth to inspect it. Ctrl/Cmd-click selects a bridge
                    span.
                  </p>
                </div>
                <Stack direction="horizontal" gap={2}>
                  <div
                    aria-label="Odontogram visual legend"
                    className={styles.chartLegend}
                  >
                    <span>
                      <i className={styles.existingLegend} /> Existing
                    </span>
                    <span>
                      <i className={styles.plannedLegend} /> Planned
                    </span>
                  </div>
                  <Badge bg="primary">
                    {selection.selectedToothPositions.length} selected
                  </Badge>
                  {projection.issues.length > 0 && (
                    <Badge
                      bg="warning"
                      className="badge-soft-warning text-warning"
                    >
                      {projection.issues.length} not visualized
                    </Badge>
                  )}
                </Stack>
              </CardHeader>
              <CardBody>
                <Odontogram
                  ariaLabel="Patient treatment odontogram"
                  data={projection.data}
                  interactionMode="select"
                  onSelectionChange={setSelection}
                  selection={selection}
                  view="side-and-occlusal"
                />
                {projection.issues.length > 0 && (
                  <div className={styles.projectionNotice}>
                    <Icon icon="info" />
                    <span>
                      Rich clinical details remain in the record even when the
                      current renderer has no matching symbol.
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col className={styles.detailsColumn}>
            <ToothDetailsPanel
              actCode={actCode}
              capabilityContext={{
                base: activeToothVisual?.base ?? 'natural',
                dentition: activeToothVisual?.dentition ?? 'permanent',
              }}
              activeTooth={activeTooth}
              acts={activeToothActs}
              actor={actor}
              canDocument={canDocument && !isReadOnly}
              fillingMaterial={fillingMaterial}
              findingCode={findingCode}
              findingDetail={findingDetail}
              findingAdditionalDetail={findingAdditionalDetail}
              findingSearch={findingSearch}
              findings={activeToothFindings}
              note={note}
              onActCodeChange={selectActCode}
              onAddAct={addAct}
              onAddFinding={addFinding}
              onApproveAct={(actId) =>
                runAction(
                  () => approveWorkspaceAct(visit, actor, actId, new Date()),
                  'Treatment act approved.',
                )
              }
              onApproveFinding={(findingId) =>
                runAction(
                  () =>
                    approveWorkspaceFinding(
                      visit,
                      actor,
                      findingId,
                      new Date(),
                    ),
                  'Clinical finding confirmed.',
                )
              }
              onFillingMaterialChange={setFillingMaterial}
              onFindingCodeChange={selectFindingCode}
              onFindingDetailChange={selectFindingDetail}
              onFindingAdditionalDetailChange={setFindingAdditionalDetail}
              onFindingSearchChange={setFindingSearch}
              onActSearchChange={setActSearch}
              onNoteChange={setNote}
              onPeriodontalSiteChange={setPeriodontalSite}
              onRestorationMaterialChange={setRestorationMaterial}
              onSurfacesChange={setSurfaces}
              onTransitionAct={(actId, status) =>
                runAction(
                  () =>
                    transitionWorkspaceAct(
                      visit,
                      actor,
                      actId,
                      status,
                      new Date(),
                    ),
                  treatmentActTransitionMessage(status),
                )
              }
              periodontalSite={periodontalSite}
              restorationMaterial={restorationMaterial}
              selectedAct={selectedAct}
              selectedFinding={selectedFinding}
              actSearch={actSearch}
              selectedToothCount={selection.selectedToothPositions.length}
              surfaces={surfaces}
            />
          </Col>
        </Row>
      )}

      {activeTab === 'record' && (
        <ClinicalRecord
          actor={actor}
          onApproveAct={(id) =>
            runAction(
              () => approveWorkspaceAct(visit, actor, id, new Date()),
              'Treatment act approved.',
            )
          }
          onApproveFinding={(id) =>
            runAction(
              () => approveWorkspaceFinding(visit, actor, id, new Date()),
              'Clinical finding confirmed.',
            )
          }
          onTransitionAct={(actId, status) =>
            runAction(
              () =>
                transitionWorkspaceAct(visit, actor, actId, status, new Date()),
              treatmentActTransitionMessage(status),
            )
          }
          projectionIssueIds={
            new Set(projection.issues.map(({ recordId }) => recordId))
          }
          visit={visit}
        />
      )}

      {activeTab === 'periodontal' && (
        <PeriodontalWorkspace
          actor={actor}
          canDocument={canDocument && !isReadOnly}
          onVisitChange={setVisit}
          visit={visit}
        />
      )}

      {activeTab === 'handoff' && (
        <HandoffPanel
          actor={actor}
          onAction={(action, message) => runAction(action, message)}
          visit={visit}
        />
      )}
    </div>
  );
}

function PatientVisitHeader({
  actor,
  dentist,
  onActorChange,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly dentist: MockTreatmentActor;
  readonly onActorChange: (actor: MockTreatmentActor) => void;
  readonly visit: TreatmentVisit;
}) {
  return (
    <Card className={`${styles.patientHeader} mb-3`}>
      <CardBody>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className={styles.patientAvatar}>OM</div>
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h4 className="mb-0">{MOCK_TREATMENT_PATIENT.name}</h4>
              <Badge bg="danger" className="badge-soft-danger text-danger">
                Penicillin allergy
              </Badge>
              <Badge bg="warning" className="badge-soft-warning text-warning">
                Anticoagulant
              </Badge>
            </div>
            <p className="text-muted mb-0 mt-1">
              {MOCK_TREATMENT_PATIENT.sex} · Born{' '}
              {MOCK_TREATMENT_PATIENT.dateOfBirth} · Chair{' '}
              {visit.chairId ?? '—'} · Visit {visit.id}
            </p>
          </div>
          <div className="text-end">
            <Badge className="mb-2" bg={visitStatusVariant(visit.status)}>
              {treatmentVisitStatusLabels[visit.status]}
            </Badge>
            <FormSelect
              aria-label="Demo actor"
              className={styles.actorSelect}
              onChange={(event) =>
                onActorChange(
                  event.currentTarget.value === 'assistant'
                    ? MOCK_ASSISTANT
                    : dentist,
                )
              }
              size="sm"
              value={actor.role === 'doctor' ? 'doctor' : 'assistant'}
            >
              <option value="doctor">Dentist · {dentist.name}</option>
              <option value="assistant">
                Assistant · {MOCK_ASSISTANT.name}
              </option>
            </FormSelect>
            <small className="text-muted d-block mt-1">Demo role preview</small>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

interface ToothDetailsPanelProps {
  readonly activeTooth: ToothPosition | null;
  readonly capabilityContext: TreatmentCapabilityContext;
  readonly selectedToothCount: number;
  readonly surfaces: readonly ToothSurface[];
  readonly findings: readonly ClinicalFinding[];
  readonly acts: readonly TreatmentAct[];
  readonly actor: MockTreatmentActor;
  readonly canDocument: boolean;
  readonly findingCode: ClinicalFindingCode;
  readonly findingDetail: string;
  readonly findingAdditionalDetail: string;
  readonly findingSearch: string;
  readonly selectedFinding: ReturnType<typeof getClinicalFindingOption>;
  readonly actCode: TreatmentActCode;
  readonly actSearch: string;
  readonly selectedAct: ReturnType<typeof getTreatmentActOption>;
  readonly fillingMaterial: string;
  readonly restorationMaterial: string;
  readonly periodontalSite: PeriodontalSite;
  readonly note: string;
  readonly onSurfacesChange: (surfaces: readonly ToothSurface[]) => void;
  readonly onFindingCodeChange: (code: ClinicalFindingCode) => void;
  readonly onFindingDetailChange: (value: string) => void;
  readonly onFindingAdditionalDetailChange: (value: string) => void;
  readonly onFindingSearchChange: (value: string) => void;
  readonly onActSearchChange: (value: string) => void;
  readonly onActCodeChange: (code: TreatmentActCode) => void;
  readonly onFillingMaterialChange: (value: string) => void;
  readonly onRestorationMaterialChange: (value: string) => void;
  readonly onPeriodontalSiteChange: (value: PeriodontalSite) => void;
  readonly onNoteChange: (value: string) => void;
  readonly onAddFinding: () => void;
  readonly onAddAct: () => void;
  readonly onApproveFinding: (id: string) => void;
  readonly onApproveAct: (id: string) => void;
  readonly onTransitionAct: (id: string, status: TreatmentActStatus) => void;
}

function ToothDetailsPanel(props: ToothDetailsPanelProps) {
  const [mode, setMode] = useState<'finding' | 'act'>('finding');
  const selectedCapability =
    mode === 'finding'
      ? props.selectedFinding?.capability
      : props.selectedAct?.capability;
  const capabilityPresentation = selectedCapability
    ? getTreatmentCapabilityPresentation(
        selectedCapability,
        {
          ...props.capabilityContext,
          subtype: mode === 'finding' ? props.findingDetail : undefined,
        },
      )
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
                    !props.canDocument || capabilityPresentation === 'not-available'
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
                    This clinical concept is not available for the selected tooth
                    base or dentition.
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

function FindingFormFields(props: ToothDetailsPanelProps) {
  return (
    <>
      <FormLabel htmlFor="finding-type">Finding</FormLabel>
      <FormControl
        aria-label="Search findings"
        className="mb-2"
        disabled={!props.canDocument}
        onChange={(event) => props.onFindingSearchChange(event.currentTarget.value)}
        placeholder="Search clinical families"
        value={props.findingSearch}
      />
      <FormSelect
        className="mb-3"
        disabled={!props.canDocument}
        id="finding-type"
        onChange={(event) =>
          props.onFindingCodeChange(
            event.currentTarget.value as ClinicalFindingCode,
          )
        }
        value={props.findingCode}
      >
        {groupFindingOptions(props.findingSearch).map(([group, options]) => (
          <optgroup key={group} label={group}>
            {options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </FormSelect>

      {props.selectedFinding?.target === 'periodontal' && (
        <>
          <FormLabel htmlFor="periodontal-site">Periodontal site</FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="periodontal-site"
            onChange={(event) =>
              props.onPeriodontalSiteChange(
                event.currentTarget.value as PeriodontalSite,
              )
            }
            value={props.periodontalSite}
          >
            {PERIODONTAL_SITE_OPTIONS.map((site) => (
              <option key={site}>{site}</option>
            ))}
          </FormSelect>
        </>
      )}

      {props.selectedFinding?.detailOptions && (
        <>
          <FormLabel htmlFor="finding-detail">Clinical detail</FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-detail"
            onChange={(event) =>
              props.onFindingDetailChange(event.currentTarget.value)
            }
            value={props.findingDetail}
          >
            {props.selectedFinding.detailOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </>
      )}

      {props.selectedFinding?.numericDetail && (
        <>
          <FormLabel htmlFor="finding-number">
            {props.selectedFinding.numericDetail.label}
          </FormLabel>
          <FormControl
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-number"
            max={props.selectedFinding.numericDetail.max}
            min={props.selectedFinding.numericDetail.min}
            onChange={(event) =>
              props.onFindingDetailChange(event.currentTarget.value)
            }
            type="number"
            value={props.findingDetail}
          />
        </>
      )}

      {props.findingCode === 'EXISTING_FIXED_RESTORATION' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="finding-restoration-material"
          label="Restoration material"
          onChange={props.onRestorationMaterialChange}
          options={restorationMaterialOptions(props.findingDetail)}
          value={props.restorationMaterial}
        />
      )}
    </>
  );
}

function ActFormFields(props: ToothDetailsPanelProps) {
  return (
    <>
      <FormLabel htmlFor="act-type">Treatment act</FormLabel>
      <FormControl
        aria-label="Search treatment acts"
        className="mb-2"
        disabled={!props.canDocument}
        onChange={(event) => props.onActSearchChange(event.currentTarget.value)}
        placeholder="Search treatment families"
        value={props.actSearch}
      />
      <FormSelect
        className="mb-3"
        disabled={!props.canDocument}
        id="act-type"
        onChange={(event) =>
          props.onActCodeChange(event.currentTarget.value as TreatmentActCode)
        }
        value={props.actCode}
      >
        {groupActOptions(props.actSearch).map(([group, options]) => (
          <optgroup key={group} label={group}>
            {options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </FormSelect>
      {props.selectedAct?.target === 'bridge' && (
        <Alert className="py-2 fs-sm" variant="info">
          Select a contiguous span with Ctrl/Cmd-click. At least one selected
          position must be missing for a pontic.
        </Alert>
      )}

      {props.selectedFinding?.additionalDetailOptions && (
        <>
          <FormLabel htmlFor="finding-additional-detail">Additional clinical detail</FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-additional-detail"
            onChange={(event) => props.onFindingAdditionalDetailChange(event.currentTarget.value)}
            value={props.findingAdditionalDetail}
          >
            {props.selectedFinding.additionalDetailOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FormSelect>
        </>
      )}

      {props.selectedAct?.target === 'arch' && (
        <Alert className="py-2 fs-sm" variant="info">
          Select the affected gap or arch units. The prosthesis remains one
          grouped arch-owned act rather than unrelated tooth records.
        </Alert>
      )}
      {props.selectedAct?.requiresMaterial === 'filling' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="act-filling-material"
          label="Filling material"
          onChange={props.onFillingMaterialChange}
          options={FILLING_MATERIALS}
          value={props.fillingMaterial}
        />
      )}
      {props.selectedAct?.requiresMaterial === 'restoration' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="act-restoration-material"
          label="Restoration material"
          onChange={props.onRestorationMaterialChange}
          options={restorationMaterialOptions(props.actCode)}
          value={props.restorationMaterial}
        />
      )}
      {props.selectedAct?.capability.projection === 'record-only' && (
        <small className="text-muted d-block mb-3">
          This act is stored in the clinical record; the current renderer has no
          dedicated symbol for it yet.
        </small>
      )}
    </>
  );
}

function MaterialSelect({
  disabled,
  id,
  label,
  onChange,
  options,
  value,
}: {
  readonly disabled: boolean;
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly (readonly [string, string])[];
  readonly value: string;
}) {
  return (
    <>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <FormSelect
        className="mb-3"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </FormSelect>
    </>
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
                compact
                onTransition={props.onTransitionAct}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ClinicalRecord({
  actor,
  onApproveAct,
  onApproveFinding,
  onTransitionAct,
  projectionIssueIds,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly onApproveAct: (id: string) => void;
  readonly onApproveFinding: (id: string) => void;
  readonly onTransitionAct: (id: string, status: TreatmentActStatus) => void;
  readonly projectionIssueIds: ReadonlySet<string>;
  readonly visit: TreatmentVisit;
}) {
  return (
    <Row className="g-3">
      <Col lg={6}>
        <RecordCard
          actor={actor}
          empty="No clinical findings recorded."
          kind="finding"
          onApprove={onApproveFinding}
          projectionIssueIds={projectionIssueIds}
          records={visit.findings}
          title="Clinical findings"
        />
      </Col>
      <Col lg={6}>
        <RecordCard
          actor={actor}
          empty="No treatment acts planned."
          kind="act"
          onApprove={onApproveAct}
          onTransitionAct={onTransitionAct}
          projectionIssueIds={projectionIssueIds}
          records={visit.acts}
          title="Treatment acts"
        />
      </Col>
    </Row>
  );
}

function RecordCard({
  actor,
  empty,
  kind,
  onApprove,
  onTransitionAct,
  projectionIssueIds,
  records,
  title,
}: {
  readonly actor: MockTreatmentActor;
  readonly empty: string;
  readonly kind: 'finding' | 'act';
  readonly onApprove: (id: string) => void;
  readonly onTransitionAct?: (id: string, status: TreatmentActStatus) => void;
  readonly projectionIssueIds: ReadonlySet<string>;
  readonly records: readonly (ClinicalFinding | TreatmentAct)[];
  readonly title: string;
}) {
  return (
    <Card className={styles.recordCard}>
      <CardHeader>
        <h5 className="mb-0">{title}</h5>
      </CardHeader>
      <CardBody>
        {records.length === 0 ? (
          <p className="text-muted">{empty}</p>
        ) : (
          <div className={styles.recordList}>
            {records.map((record) => {
              const label =
                kind === 'act'
                  ? getTreatmentActOption(record.code as TreatmentActCode)
                      ?.label
                  : getClinicalFindingOption(record.code as ClinicalFindingCode)
                      ?.label;
              return (
                <div className={styles.recordRow} key={record.id}>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <span className="fw-semibold">
                        {label ?? record.code}
                      </span>
                      <Badge bg={recordStatusVariant(record.status)}>
                        {record.status}
                      </Badge>
                      {projectionIssueIds.has(record.id) && (
                        <Badge bg="light" className="text-muted">
                          Not visualized
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted">
                      {formatTarget(
                        record.target.toothNumbers,
                        record.target.surfaces,
                      )}
                    </small>
                    {record.note && (
                      <p className="mb-0 mt-1 fs-sm">{record.note}</p>
                    )}
                  </div>
                  {record.status === 'DRAFT' && actor.role === 'doctor' && (
                    <Button
                      onClick={() => onApprove(record.id)}
                      size="sm"
                      variant="success"
                    >
                      Approve
                    </Button>
                  )}
                  {kind === 'act' &&
                    actor.role === 'doctor' &&
                    onTransitionAct &&
                    record.status !== 'DRAFT' && (
                      <ActLifecycleButtons
                        act={record as TreatmentAct}
                        onTransition={onTransitionAct}
                      />
                    )}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ActLifecycleButtons({
  act,
  compact = false,
  onTransition,
}: {
  readonly act: TreatmentAct;
  readonly compact?: boolean;
  readonly onTransition: (id: string, status: TreatmentActStatus) => void;
}) {
  if (act.status !== 'PLANNED' && act.status !== 'IN_PROGRESS') return null;

  return (
    <div className="d-flex flex-wrap gap-1">
      {act.status === 'PLANNED' && (
        <Button
          onClick={() => onTransition(act.id, 'IN_PROGRESS')}
          size="sm"
          variant="outline-primary"
        >
          {compact ? 'Start' : 'Start treatment'}
        </Button>
      )}
      <Button
        onClick={() => onTransition(act.id, 'COMPLETED')}
        size="sm"
        variant="success"
      >
        {compact ? 'Done' : 'Mark completed'}
      </Button>
      {!compact && (
        <Button
          onClick={() => onTransition(act.id, 'CANCELLED')}
          size="sm"
          variant="outline-danger"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

function HandoffPanel({
  actor,
  onAction,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly onAction: (action: () => TreatmentVisit, message: string) => void;
  readonly visit: TreatmentVisit;
}) {
  const handoff = visit.documentationHandoff;
  return (
    <Row className="justify-content-center">
      <Col xl={8}>
        <Card>
          <CardHeader>
            <h5 className="mb-1">Dentist-to-assistant documentation handoff</h5>
            <p className="text-muted mb-0">
              The assistant enters drafts; the responsible dentist retains
              clinical approval and completion authority.
            </p>
          </CardHeader>
          <CardBody>
            <div className={styles.handoffFlow}>
              {['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED'].map(
                (status, index) => (
                  <div
                    className={
                      handoffStatusReached(handoff?.status, status)
                        ? styles.handoffStepActive
                        : styles.handoffStep
                    }
                    key={status}
                  >
                    <span>{index + 1}</span>
                    <small>{status.replaceAll('_', ' ')}</small>
                  </div>
                ),
              )}
            </div>

            {handoff ? (
              <div className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between gap-2">
                  <div>
                    <strong>{MOCK_ASSISTANT.name}</strong>
                    <p className="text-muted mb-0">
                      Dental assistant · Revision {handoff.revision}
                    </p>
                  </div>
                  <Badge bg="info">
                    {documentationHandoffStatusLabels[handoff.status]}
                  </Badge>
                </div>
                {handoff.reviewNote && (
                  <Alert className="mb-0 mt-3 py-2" variant="warning">
                    {handoff.reviewNote}
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="light">
                No assistant is assigned to this visit.
              </Alert>
            )}

            <div className="d-flex flex-wrap gap-2">
              {actor.role === 'doctor' && !handoff && (
                <Button
                  onClick={() =>
                    onAction(
                      () =>
                        assignWorkspaceDocumentation(
                          visit,
                          actor,
                          MOCK_ASSISTANT.userId,
                          'handoff-mock-1',
                          new Date(),
                        ),
                      'Documentation assigned to the assistant.',
                    )
                  }
                >
                  Assign to {MOCK_ASSISTANT.name}
                </Button>
              )}
              {actor.role === 'dental_assistant' &&
                (handoff?.status === 'ASSIGNED' ||
                  handoff?.status === 'RETURNED') && (
                  <Button
                    onClick={() =>
                      onAction(
                        () =>
                          startWorkspaceDocumentation(visit, actor, new Date()),
                        'Documentation session started.',
                      )
                    }
                  >
                    Start documentation
                  </Button>
                )}
              {actor.role === 'dental_assistant' &&
                handoff?.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() =>
                      onAction(
                        () =>
                          submitWorkspaceDocumentation(
                            visit,
                            actor,
                            new Date(),
                          ),
                        'Documentation submitted for dentist review.',
                      )
                    }
                    variant="success"
                  >
                    Submit for review
                  </Button>
                )}
              {actor.role === 'doctor' && handoff?.status === 'SUBMITTED' && (
                <>
                  <Button
                    onClick={() =>
                      onAction(
                        () =>
                          reviewWorkspaceDocumentation(
                            visit,
                            actor,
                            'ACCEPT',
                            new Date(),
                          ),
                        'Assistant documentation accepted.',
                      )
                    }
                    variant="success"
                  >
                    Accept documentation
                  </Button>
                  <Button
                    onClick={() =>
                      onAction(
                        () =>
                          reviewWorkspaceDocumentation(
                            visit,
                            actor,
                            'RETURN',
                            new Date(),
                          ),
                        'Documentation returned for correction.',
                      )
                    }
                    variant="outline-warning"
                  >
                    Return for correction
                  </Button>
                </>
              )}
              {actor.role === 'doctor' &&
                visit.status === 'READY_FOR_COMPLETION' && (
                  <Button
                    onClick={() =>
                      onAction(
                        () => completeWorkspaceVisit(visit, actor, new Date()),
                        'Visit completed and locked.',
                      )
                    }
                    variant="primary"
                  >
                    Complete visit
                  </Button>
                )}
            </div>
            <small className="text-muted d-block mt-3">
              Use the demo role selector above to walk through both sides of the
              workflow.
            </small>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

const buildTarget = (
  target: TreatmentCatalogueTarget,
  toothNumbers: readonly ToothPosition[],
  surfaces: readonly ToothSurface[],
  periodontalSite: PeriodontalSite,
) => ({
  arch:
    target === 'arch'
      ? toothNumbers[0] && toothNumbers[0] < 30
        ? ('UPPER' as const)
        : ('LOWER' as const)
      : null,
  kind:
    target === 'surface'
      ? ('TOOTH_SURFACE' as const)
      : target === 'index-surface'
        ? ('INDEX_SURFACE' as const)
        : target === 'tooth-region'
          ? ('TOOTH_REGION' as const)
      : target === 'bridge'
        ? ('BRIDGE_SPAN' as const)
        : target === 'arch'
          ? ('ARCH' as const)
          : target === 'periodontal'
            ? ('PERIODONTAL_SITE' as const)
            : ('TOOTH' as const),
  periodontalSites: target === 'periodontal' ? [periodontalSite] : [],
  surfaces: (target === 'surface' || target === 'tooth-region'
    ? surfaces.map((surface) => surface.toUpperCase())
    : []) as TreatmentSurface[],
  toothNumbers,
});

const requiresSurface = (target?: TreatmentCatalogueTarget) =>
  target === 'surface' ||
  target === 'index-surface' ||
  target === 'tooth-region';

const isPartialRestoration = (code: string) =>
  code === 'INLAY' || code === 'ONLAY' || code === 'VENEER';

const isPartialRestorationMaterial = (material: string) =>
  PARTIAL_RESTORATION_MATERIALS.some(([value]) => value === material);

const restorationMaterialOptions = (restoration: string) =>
  isPartialRestoration(restoration)
    ? PARTIAL_RESTORATION_MATERIALS
    : RESTORATION_MATERIALS;

const canCurrentActorDocument = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
) => {
  if (actor.role === 'doctor')
    return actor.userId === visit.responsibleDentistId;
  const handoff = visit.documentationHandoff;
  return Boolean(
    handoff?.assignedToAssistantId === actor.userId &&
      ['ASSIGNED', 'IN_PROGRESS', 'RETURNED'].includes(handoff.status),
  );
};

const validateBridgeSelection = (
  positions: readonly ToothPosition[],
  data: ReturnType<typeof mapTreatmentVisitToOdontogram>['data'],
): string | null => {
  if (positions.length < 2) return 'Select at least two teeth for a bridge.';
  const indices = positions
    .map((position) => TOOTH_POSITIONS.indexOf(position))
    .sort((left, right) => left - right);
  const sameArch =
    indices.every((index) => index < 16) ||
    indices.every((index) => index >= 16);
  if (!sameArch) return 'A bridge cannot cross between upper and lower arches.';
  if (
    indices.some(
      (index, offset) => offset > 0 && index !== indices[offset - 1] + 1,
    )
  ) {
    return 'Bridge teeth must form one contiguous span.';
  }
  const hasPontic = positions.some(
    (position) =>
      data.teeth.find((tooth) => tooth.position === position)?.base ===
      'missing',
  );
  return hasPontic
    ? null
    : 'Select a span containing at least one missing tooth for the pontic.';
};

const groupFindingOptions = (search = '') => {
  const query = search.trim().toLocaleLowerCase();
  const groups = new Map<string, typeof CLINICAL_FINDING_OPTIONS>();
  for (const option of CLINICAL_FINDING_OPTIONS) {
    if (
      query &&
      !`${option.label} ${option.code} ${option.group}`
        .toLocaleLowerCase()
        .includes(query)
    ) {
      continue;
    }
    groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
  }
  return [...groups.entries()];
};

const groupActOptions = (search = '') => {
  const query = search.trim().toLocaleLowerCase();
  const groups = new Map<string, typeof TREATMENT_ACT_OPTIONS>();
  for (const option of TREATMENT_ACT_OPTIONS) {
    if (
      query &&
      !`${option.label} ${option.code} ${option.category}`
        .toLocaleLowerCase()
        .includes(query)
    ) {
      continue;
    }
    groups.set(option.category, [
      ...(groups.get(option.category) ?? []),
      option,
    ]);
  }
  return [...groups.entries()];
};

const formatTarget = (
  teeth: readonly number[],
  surfaces: readonly TreatmentSurface[],
) =>
  `Tooth ${teeth.join(', ')}${surfaces.length > 0 ? ` · ${surfaces.join(', ')}` : ''}`;

const visitStatusVariant = (status: TreatmentVisit['status']) =>
  status === 'COMPLETED'
    ? 'success'
    : status === 'AWAITING_REVIEW'
      ? 'warning'
      : status === 'CANCELLED'
        ? 'danger'
        : 'primary';

const recordStatusVariant = (status: string) =>
  status === 'COMPLETED' || status === 'CONFIRMED'
    ? 'success'
    : status === 'DRAFT'
      ? 'warning'
      : status === 'CANCELLED' || status === 'ENTERED_IN_ERROR'
        ? 'danger'
        : 'primary';

const treatmentActTransitionMessage = (status: TreatmentActStatus) =>
  status === 'IN_PROGRESS'
    ? 'Treatment act started.'
    : status === 'COMPLETED'
      ? 'Treatment act completed and updated on the odontogram.'
      : status === 'CANCELLED'
        ? 'Treatment act cancelled and removed from the projection.'
        : 'Treatment act updated.';

const handoffStatusReached = (current: string | undefined, target: string) => {
  const order = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED'];
  if (current === 'RETURNED')
    return target === 'ASSIGNED' || target === 'IN_PROGRESS';
  return current ? order.indexOf(current) >= order.indexOf(target) : false;
};
