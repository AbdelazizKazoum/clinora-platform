import { Col, Row } from 'react-bootstrap';
import type { TreatmentEntryForm } from '../hooks/use-treatment-entry-form';
import type { TreatmentVisitActions } from '../hooks/use-local-treatment-visit';
import type { TreatmentVisit } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import type {
  TreatmentProjectionMode,
  TreatmentWorkflowProjection,
} from '../model/treatment-workflow';
import { TreatmentOdontogramCard } from './treatment-odontogram-card';
import { TreatmentActsTable } from './treatment-acts-table';
import { ToothDetailsPanel } from './tooth-details-panel';
import styles from './treatment-workspace.module.scss';

export function TreatmentChartWorkspace({
  actor,
  actions,
  canDocument,
  entry,
  projectionMode,
  onProjectionModeChange,
  workflow,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly actions: TreatmentVisitActions;
  readonly canDocument: boolean;
  readonly entry: TreatmentEntryForm;
  readonly projectionMode: TreatmentProjectionMode;
  readonly onProjectionModeChange: (mode: TreatmentProjectionMode) => void;
  readonly workflow: TreatmentWorkflowProjection;
  readonly visit: TreatmentVisit;
}) {
  const { activeTooth, selection, setSelection, ...fields } = entry;
  const projection = workflow.projections[projectionMode];
  const tooth = projection.data.teeth.find(
    ({ position }) => position === activeTooth,
  );
  return (
    <Row className="g-3">
      <Col className={styles.chartColumn}>
        <TreatmentOdontogramCard
          projection={projection}
          projectionMode={projectionMode}
          conflictCount={workflow.conflicts.length}
          selection={selection}
          onProjectionModeChange={onProjectionModeChange}
          onSelectionChange={setSelection}
        />
        <TreatmentActsTable
          actor={actor}
          visit={visit}
          currentSession
          onApproveAct={actions.approveAct}
          onTransitionAct={actions.transitionAct}
        />
      </Col>
      <Col className={styles.detailsColumn}>
        <ToothDetailsPanel
          {...fields}
          activeTooth={activeTooth}
          capabilityContext={{
            base: tooth?.base ?? 'natural',
            dentition: tooth?.dentition ?? 'permanent',
          }}
          acts={visit.acts.filter(
            (act) =>
              activeTooth !== null &&
              act.target.toothNumbers.includes(activeTooth),
          )}
          findings={visit.findings.filter(
            (finding) =>
              activeTooth !== null &&
              finding.target.toothNumbers.includes(activeTooth),
          )}
          actor={actor}
          canDocument={canDocument}
          selectedToothCount={selection.selectedToothPositions.length}
          onApproveAct={actions.approveAct}
          onApproveFinding={actions.approveFinding}
          onTransitionAct={actions.transitionAct}
        />
      </Col>
    </Row>
  );
}
