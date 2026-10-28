'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Alert } from 'react-bootstrap';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { PatientVisitHeader } from '../components/patient-visit-header';
import {
  TreatmentWorkspaceTabs,
  type WorkspaceTab,
} from '../components/treatment-workspace-tabs';
import { TreatmentChartWorkspace } from '../components/treatment-chart-workspace';
import { ClinicalFindingsTable } from '../components/clinical-findings-table';
import { TreatmentPlansWorkspace } from '../components/treatment-plans-workspace';
import { TreatmentVisitNavigation } from '../components/treatment-visit-navigation';
import { DocumentationHandoffPanel } from '../components/documentation-handoff-panel';
import { useLocalTreatmentVisit } from '../hooks/use-local-treatment-visit';
import { useTreatmentEntryForm } from '../hooks/use-treatment-entry-form';
import type { TreatmentLaunchContext } from '../model/treatment';
import { canEditTreatmentDraft } from '../model/treatment.rules';
import {
  buildTreatmentWorkflowProjection,
  type TreatmentProjectionMode,
} from '../model/treatment-workflow';
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

export function TreatmentWorkspacePage({
  launchContext,
}: TreatmentWorkspacePageProps) {
  const workspace = useLocalTreatmentVisit(launchContext);
  return (
    <TreatmentVisitWorkspace key={workspace.visit.id} workspace={workspace} />
  );
}

function TreatmentVisitWorkspace({
  workspace,
}: {
  readonly workspace: ReturnType<typeof useLocalTreatmentVisit>;
}) {
  const {
    visit,
    visits,
    planItems,
    removablePlanIds,
    sessions,
    actor,
    setActor,
    dentist,
    assistant,
    patient,
    actions,
    feedback,
    showFeedback,
  } = workspace;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chart');
  const [handoffInstruction, setHandoffInstruction] = useState('');
  const [projectionMode, setProjectionMode] =
    useState<TreatmentProjectionMode>('combined');
  // All three projections are built together; switching mode only selects one.
  const workflow = useMemo(
    () => buildTreatmentWorkflowProjection(visit),
    [visit],
  );
  const projection = workflow.projections[projectionMode];
  const projectionIssueIds = useMemo(
    () => new Set(projection.issues.map(({ recordId }) => recordId)),
    [projection.issues],
  );
  // Keep unsaved entries and selection across tab switches.
  const entry = useTreatmentEntryForm({
    actions,
    data: projection.data,
    showFeedback,
  });
  const canDocument = canEditTreatmentDraft(visit, actor.userId, actor.role);

  return (
    <div className={styles.workspace}>
      <PageBreadcrumb title="Treatment workspace" subtitle="Visits" />
      <PatientVisitHeader
        actor={actor}
        dentist={dentist}
        assistant={assistant}
        patient={patient}
        onActorChange={setActor}
        visit={visit}
      />
      <TreatmentVisitNavigation
        visit={visit}
        visits={visits}
        actor={actor}
        actions={actions}
      />
      {feedback && (
        <Alert
          className="d-flex align-items-center justify-content-between py-2"
          dismissible
          onClose={() => showFeedback(null)}
          variant={feedback.variant}
        >
          <span>{feedback.message}</span>
        </Alert>
      )}
      <TreatmentWorkspaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        visit={visit}
      />
      {activeTab === 'chart' && (
        <TreatmentChartWorkspace
          removablePlanIds={removablePlanIds}
          actor={actor}
          actions={actions}
          canDocument={canDocument}
          entry={entry}
          projectionMode={projectionMode}
          onProjectionModeChange={setProjectionMode}
          workflow={workflow}
          visit={visit}
        />
      )}
      {activeTab === 'findings' && (
        <ClinicalFindingsTable
          actor={actor}
          onApproveFinding={actions.approveFinding}
          onRemoveFinding={actions.removeFinding}
          projectionIssueIds={projectionIssueIds}
          visit={visit}
        />
      )}
      {activeTab === 'treatment-plans' && (
        <TreatmentPlansWorkspace
          removablePlanIds={removablePlanIds}
          actor={actor}
          actions={actions}
          planItems={planItems}
          sessions={sessions}
          projectionIssueIds={projectionIssueIds}
          visit={visit}
        />
      )}
      {activeTab === 'periodontal' && (
        <PeriodontalWorkspace
          actor={actor}
          canDocument={canDocument}
          onExaminationChange={actions.updatePeriodontalExamination}
          onApproveExamination={actions.approvePeriodontalExamination}
          visit={visit}
        />
      )}
      {activeTab === 'handoff' && (
        <DocumentationHandoffPanel
          actor={actor}
          assistant={assistant}
          actions={actions}
          instruction={handoffInstruction}
          onInstructionChange={setHandoffInstruction}
          visit={visit}
        />
      )}
    </div>
  );
}
