'use client';

import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Col, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap';

import type { MockTreatmentActor } from '../model/treatment-workspace';
import type { TreatmentVisit } from '../model/treatment';
import {
  CEJ_VISIBILITY_VALUES,
  FURCATION_GRADES,
  GINGIVAL_PHENOTYPES,
  MILLER_CLASSES,
  PERIODONTAL_GRADES,
  PERIODONTAL_INDEX_SURFACES,
  PERIODONTAL_SITES,
  ROOT_CONCAVITY_VALUES,
  getFurcationEntrances,
  getPeriodontalTooth,
  summarizePeriodontalExamination,
  updateFurcation,
  updatePeriodontalMobility,
  updatePeriodontalSite,
  updatePeriodontalToothDetail,
  updatePlaque,
  updateSurfaceIndex,
  type FurcationGrade,
  type GingivalPhenotype,
  type MillerClass,
  type PeriodontalGrade,
  type PeriodontalSummary,
} from '../model/periodontal';
import {
  approveWorkspacePeriodontalExamination,
  updateWorkspacePeriodontalExamination,
} from '../model/treatment-workspace';

export interface PeriodontalWorkspaceProps {
  readonly actor: MockTreatmentActor;
  readonly canDocument: boolean;
  readonly onVisitChange: (visit: TreatmentVisit) => void;
  readonly visit: TreatmentVisit;
}

const TOOTH_POSITIONS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

export function PeriodontalWorkspace({
  actor,
  canDocument,
  onVisitChange,
  visit,
}: PeriodontalWorkspaceProps) {
  const [toothNumber, setToothNumber] = useState<number>(16);
  const examination = visit.periodontalExamination;
  const tooth = getPeriodontalTooth(examination, toothNumber);
  const implant = isImplantTooth(visit, toothNumber);
  const presentNaturalToothNumbers = TOOTH_POSITIONS.filter(
    (position) => !isImplantTooth(visit, position) && !isMissingTooth(visit, position),
  );
  const summary = useMemo(
    () => summarizePeriodontalExamination(examination, presentNaturalToothNumbers),
    [examination, presentNaturalToothNumbers.join(',')],
  );

  const apply = (
    update: Parameters<typeof updateWorkspacePeriodontalExamination>[2],
  ) => {
    try {
      onVisitChange(
        updateWorkspacePeriodontalExamination(visit, actor, update, new Date()),
      );
    } catch {
      // The parent workspace owns the general feedback channel. Disabled
      // controls prevent normal UI errors; failed transitions remain harmless.
    }
  };

  const approve = () => {
    if (actor.role !== 'doctor') return;
    try {
      onVisitChange(
        approveWorkspacePeriodontalExamination(visit, actor, new Date()),
      );
    } catch {
      // The examination may be empty; keep the panel usable without throwing.
    }
  };

  return (
    <Row className="g-3">
      <Col xl={8}>
        <Card>
          <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h5 className="mb-1">Periodontal examination</h5>
              <p className="text-muted mb-0 fs-sm">
                Six-site probing, indices, furcation, and mucogingival findings.
              </p>
            </div>
            <Badge bg={examination?.status === 'CONFIRMED' ? 'success' : 'warning'}>
              {examination?.status ?? 'EMPTY'}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
              <div>
                <FormLabel htmlFor="periodontal-tooth">Tooth</FormLabel>
                <FormSelect
                  aria-label="Periodontal tooth"
                  disabled={!canDocument}
                  id="periodontal-tooth"
                  onChange={(event) => setToothNumber(Number(event.currentTarget.value))}
                  value={toothNumber}
                >
                  {TOOTH_POSITIONS.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </FormSelect>
              </div>
              <Badge bg={implant ? 'info' : 'secondary'}>
                {implant ? 'Implant tooth' : isMissingTooth(visit, toothNumber) ? 'Missing tooth' : 'Natural tooth'}
              </Badge>
              {!canDocument && <small className="text-muted">Active dentist or assistant assignment required.</small>}
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <caption className="visually-hidden">Periodontal six-site measurements for tooth {toothNumber}</caption>
                <thead>
                  <tr><th scope="col">Site</th><th scope="col">PD mm</th><th scope="col">GM mm</th><th scope="col">CAL</th><th scope="col">BOP</th><th scope="col">Suppuration</th></tr>
                </thead>
                <tbody>
                  {PERIODONTAL_SITES.map((site) => {
                    const measurement = tooth.sites[site];
                    return (
                      <tr key={site}>
                        <th scope="row">{site}</th>
                        <td><PeriodontalNumberInput ariaLabel={`${site} probing depth`} disabled={!canDocument || implant || isMissingTooth(visit, toothNumber)} value={measurement?.pd} onCommit={(value) => apply((exam) => updatePeriodontalSite(exam, toothNumber, site, { pd: value }))} /></td>
                        <td><PeriodontalNumberInput ariaLabel={`${site} gingival margin`} disabled={!canDocument || implant || isMissingTooth(visit, toothNumber) || measurement === undefined} value={measurement?.gm} allowNegative onCommit={(value) => apply((exam) => updatePeriodontalSite(exam, toothNumber, site, { gm: value }))} /></td>
                        <td>{measurement === undefined ? '—' : measurement.pd + (measurement.gm ?? 0)}</td>
                        <td><input aria-label={`${site} bleeding on probing`} checked={measurement?.bop ?? false} disabled={!canDocument || measurement === undefined} onChange={(event) => apply((exam) => updatePeriodontalSite(exam, toothNumber, site, { bop: event.currentTarget.checked }))} type="checkbox" /></td>
                        <td><input aria-label={`${site} suppuration`} checked={measurement?.suppuration ?? false} disabled={!canDocument || measurement === undefined} onChange={(event) => apply((exam) => updatePeriodontalSite(exam, toothNumber, site, { suppuration: event.currentTarget.checked }))} type="checkbox" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PeriodontalDetailControls
              canDocument={canDocument}
              implant={implant}
              tooth={tooth}
              toothNumber={toothNumber}
              onUpdate={apply}
            />

            {actor.role === 'doctor' && examination?.status === 'DRAFT' && (
              <Button className="mt-3" onClick={approve} variant="success">Confirm periodontal examination</Button>
            )}
          </CardBody>
        </Card>
      </Col>
      <Col xl={4}>
        <PeriodontalSummaryCard summary={summary} classification={examination ? 'NOT_CLINICALLY_APPROVED' : 'EMPTY'} />
      </Col>
    </Row>
  );
}

function PeriodontalNumberInput({
  allowNegative = false,
  ariaLabel,
  disabled,
  onCommit,
  value,
}: {
  readonly allowNegative?: boolean;
  readonly ariaLabel: string;
  readonly disabled: boolean;
  readonly onCommit: (value: number | null) => void;
  readonly value?: number;
}) {
  return (
    <FormControl
      aria-label={ariaLabel}
      disabled={disabled}
      max={allowNegative ? 20 : 15}
      min={allowNegative ? -10 : 1}
      onChange={(event) => {
        const raw = event.currentTarget.value;
        onCommit(raw === '' ? null : Number(raw));
      }}
      step={1}
      type="number"
      value={value ?? ''}
    />
  );
}

function PeriodontalDetailControls({
  canDocument,
  implant,
  onUpdate,
  tooth,
  toothNumber,
}: {
  readonly canDocument: boolean;
  readonly implant: boolean;
  readonly onUpdate: (update: Parameters<typeof updateWorkspacePeriodontalExamination>[2]) => void;
  readonly tooth: ReturnType<typeof getPeriodontalTooth>;
  readonly toothNumber: number;
}) {
  const entrances = getFurcationEntrances(toothNumber);
  return (
    <div className="border rounded p-3">
      <Row className="g-3">
        <Col md={4}>
          <FormLabel htmlFor="periodontal-mobility">Mobility</FormLabel>
          <FormSelect aria-label="Mobility grade" disabled={!canDocument || implant} id="periodontal-mobility" onChange={(event) => onUpdate((exam) => updatePeriodontalMobility(exam, toothNumber, event.currentTarget.value === '' ? null : Number(event.currentTarget.value) as PeriodontalGrade))} value={tooth.mobility ?? ''}>
            <option value="">Not charted</option>
            {PERIODONTAL_GRADES.map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
          </FormSelect>
        </Col>
        <Col md={8}>
          <FormLabel>Furcation entrances</FormLabel>
          {entrances.length === 0 ? <div className="text-muted fs-sm">Not applicable for this tooth position.</div> : <div className="d-flex flex-wrap gap-2">{entrances.map((entrance) => <FormSelect aria-label={`${entrance} furcation grade`} disabled={!canDocument} key={entrance} onChange={(event) => onUpdate((exam) => updateFurcation(exam, toothNumber, entrance, event.currentTarget.value === '' ? null : Number(event.currentTarget.value) as FurcationGrade))} value={tooth.furcation[entrance] ?? ''}><option value="">{entrance}: not charted</option>{FURCATION_GRADES.map((grade) => <option key={grade} value={grade}>{entrance}: {grade}</option>)}</FormSelect>)}</div>}
        </Col>
        <Col md={6}><IndexSurfaceControls canDocument={canDocument} index="plaqueIndex" label="Plaque index" tooth={tooth} toothNumber={toothNumber} onUpdate={onUpdate} /></Col>
        <Col md={6}><IndexSurfaceControls canDocument={canDocument} index="gingivalIndex" label="Gingival index" tooth={tooth} toothNumber={toothNumber} onUpdate={onUpdate} /></Col>
        {implant && <><Col md={6}><IndexSurfaceControls canDocument={canDocument} index="periImplantPlaqueIndex" label="mPI" tooth={tooth} toothNumber={toothNumber} onUpdate={onUpdate} /></Col><Col md={6}><IndexSurfaceControls canDocument={canDocument} index="periImplantBleedingIndex" label="mBI" tooth={tooth} toothNumber={toothNumber} onUpdate={onUpdate} /></Col></>}
        <Col md={4}><FormLabel htmlFor="periodontal-kg">Keratinized gingiva (mm)</FormLabel><FormControl aria-label="Keratinized gingiva width" disabled={!canDocument} id="periodontal-kg" max={15} min={0} onChange={(event) => onUpdate((exam) => updatePeriodontalToothDetail(exam, toothNumber, { keratinizedGingivaWidth: event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value) }))} type="number" value={tooth.keratinizedGingivaWidth ?? ''} /></Col>
        <Col md={4}><FormLabel htmlFor="periodontal-phenotype">Gingival phenotype</FormLabel><FormSelect aria-label="Gingival phenotype" disabled={!canDocument} id="periodontal-phenotype" onChange={(event) => onUpdate((exam) => updatePeriodontalToothDetail(exam, toothNumber, { gingivalPhenotype: event.currentTarget.value === '' ? undefined : event.currentTarget.value as GingivalPhenotype }))} value={tooth.gingivalPhenotype ?? ''}><option value="">Not charted</option>{GINGIVAL_PHENOTYPES.map((value) => <option key={value} value={value}>{value}</option>)}</FormSelect></Col>
        <Col md={4}><FormLabel htmlFor="periodontal-miller">Miller class</FormLabel><FormSelect aria-label="Miller recession class" disabled={!canDocument} id="periodontal-miller" onChange={(event) => onUpdate((exam) => updatePeriodontalToothDetail(exam, toothNumber, { millerClass: event.currentTarget.value === '' ? undefined : event.currentTarget.value as MillerClass }))} value={tooth.millerClass ?? ''}><option value="">Not charted</option>{MILLER_CLASSES.map((value) => <option key={value} value={value}>{value}</option>)}</FormSelect></Col>
      </Row>
      <div className="d-flex flex-wrap gap-2 mt-3"><span className="text-muted fs-sm">Mucogingival detail</span><FormSelect aria-label="CEJ visibility" disabled={!canDocument} onChange={(event) => onUpdate((exam) => updatePeriodontalToothDetail(exam, toothNumber, { cejVisibility: event.currentTarget.value === '' ? undefined : event.currentTarget.value as (typeof CEJ_VISIBILITY_VALUES)[number] }))} value={tooth.cejVisibility ?? ''}><option value="">CEJ not charted</option>{CEJ_VISIBILITY_VALUES.map((value) => <option key={value} value={value}>{value}</option>)}</FormSelect><FormSelect aria-label="Root concavity" disabled={!canDocument} onChange={(event) => onUpdate((exam) => updatePeriodontalToothDetail(exam, toothNumber, { rootConcavity: event.currentTarget.value === '' ? undefined : event.currentTarget.value as (typeof ROOT_CONCAVITY_VALUES)[number] }))} value={tooth.rootConcavity ?? ''}><option value="">Concavity not charted</option>{ROOT_CONCAVITY_VALUES.map((value) => <option key={value} value={value}>{value}</option>)}</FormSelect></div>
      <div className="mt-3"><FormLabel>O&apos;Leary plaque presence</FormLabel><div className="d-flex flex-wrap gap-3">{PERIODONTAL_INDEX_SURFACES.map((surface) => <label className="form-check" key={surface}><input aria-label={`${surface} plaque presence`} checked={tooth.plaque.includes(surface)} className="form-check-input" disabled={!canDocument} onChange={(event) => onUpdate((exam) => updatePlaque(exam, toothNumber, surface, event.currentTarget.checked))} type="checkbox" /><span className="form-check-label">{surface}</span></label>)}</div></div>
    </div>
  );
}

function IndexSurfaceControls({
  canDocument,
  index,
  label,
  onUpdate,
  tooth,
  toothNumber,
}: {
  readonly canDocument: boolean;
  readonly index: 'plaqueIndex' | 'gingivalIndex' | 'periImplantPlaqueIndex' | 'periImplantBleedingIndex';
  readonly label: string;
  readonly onUpdate: (update: Parameters<typeof updateWorkspacePeriodontalExamination>[2]) => void;
  readonly tooth: ReturnType<typeof getPeriodontalTooth>;
  readonly toothNumber: number;
}) {
  return <div><FormLabel>{label}</FormLabel><div className="d-flex flex-wrap gap-1">{PERIODONTAL_INDEX_SURFACES.map((surface) => <FormSelect aria-label={`${label} ${surface}`} disabled={!canDocument} key={surface} onChange={(event) => onUpdate((exam) => updateSurfaceIndex(exam, toothNumber, index, surface, Number(event.currentTarget.value) as PeriodontalGrade | 0, index.startsWith('periImplant')))} value={tooth[index][surface] ?? 0}><option value={0}>{surface}: 0</option>{PERIODONTAL_GRADES.map((grade) => <option key={grade} value={grade}>{surface}: {grade}</option>)}</FormSelect>)}</div></div>;
}

function PeriodontalSummaryCard({
  classification,
  summary,
}: {
  readonly classification: 'EMPTY' | 'NOT_CLINICALLY_APPROVED';
  readonly summary: PeriodontalSummary;
}) {
  return <Card><CardHeader><h5 className="mb-0">Whole-mouth summary</h5></CardHeader><CardBody><dl className="row mb-0"><SummaryItem label="Charted sites" value={summary.chartedSites} /><SummaryItem label="Average / maximum PD" value={`${formatNumber(summary.averagePd)} / ${formatNumber(summary.maximumPd)} mm`} /><SummaryItem label="Average / maximum CAL" value={`${formatNumber(summary.averageCal)} / ${formatNumber(summary.maximumCal)} mm`} /><SummaryItem label="BOP" value={`${summary.bopPercent.toFixed(1)}%`} /><SummaryItem label="Suppuration" value={summary.suppurationSites} /><SummaryItem label="Plaque" value={`${summary.plaquePercent.toFixed(1)}%`} /><SummaryItem label="Maximum furcation" value={summary.maximumFurcation ?? '—'} /></dl>{classification === 'NOT_CLINICALLY_APPROVED' ? <Alert className="mt-3 mb-0 py-2" variant="warning">2017 periodontal classification is recorded as pending explicit clinical approval.</Alert> : <p className="text-muted mb-0 mt-3">No periodontal examination recorded.</p>}</CardBody></Card>;
}

function SummaryItem({ label, value }: { readonly label: string; readonly value: string | number }) {
  return <><dt className="col-7">{label}</dt><dd className="col-5 text-end">{value}</dd></>;
}

function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

function isImplantTooth(visit: TreatmentVisit, toothNumber: number): boolean {
  return visit.findings.some(({ code, details, status, target }) => status === 'CONFIRMED' && code === 'TOOTH_STATE' && target.toothNumbers.includes(toothNumber) && details.some(({ key, value }) => key === 'TOOTH_STATE' && value === 'IMPLANT')) || visit.acts.some(({ code, status, target }) => status === 'COMPLETED' && code === 'IMPLANT_PLACEMENT' && target.toothNumbers.includes(toothNumber));
}

function isMissingTooth(visit: TreatmentVisit, toothNumber: number): boolean {
  return visit.findings.some(({ code, details, status, target }) => status === 'CONFIRMED' && code === 'TOOTH_STATE' && target.toothNumbers.includes(toothNumber) && details.some(({ key, value }) => key === 'TOOTH_STATE' && (value === 'MISSING' || value === 'MISSING_AFTER_EXTRACTION')));
}
