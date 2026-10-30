'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Alert } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useStaffDirectory } from '@/features/staff';
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
import type { MockTreatmentActor } from '../model/treatment-workspace';
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
    secretary,
    patient,
    actions,
    feedback,
    showFeedback,
  } = workspace;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chart');
  const [handoffInstruction, setHandoffInstruction] = useState('');
  const [handoffAssistantId, setHandoffAssistantId] = useState('');
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const directory = useStaffDirectory(
    sessionStatus === 'authenticated' ? clinicId : undefined,
  );
  const assistants: readonly MockTreatmentActor[] = (directory.data ?? [])
    .filter(
      (member) =>
        member.clinicId === clinicId &&
        (member.role === 'DENTAL_ASSISTANT' || member.role === 'SECRETARY') &&
        member.status === 'active' &&
        member.isActive &&
        member.userId !== dentist.userId &&
        Boolean(member.userId),
    )
    .map((member) => ({
      userId: member.userId,
      name: member.fullName,
      role: member.role === 'SECRETARY' ? 'secretary' : 'dental_assistant',
    }));
  const assignedAssistantId = visit.documentationHandoff?.assignedToUserId;
  const assignedAssistantName = directory.data?.find(
    (member) =>
      member.clinicId === clinicId && member.userId === assignedAssistantId,
  )?.fullName;
  const previewAssistant = assignedAssistantId
    ? {
        userId: assignedAssistantId,
        name: assignedAssistantName ?? 'Assigned assistant',
        role: visit.documentationHandoff?.assignedToRole ?? 'dental_assistant',
      }
    : (assistants.find(
        (candidate) => candidate.userId === handoffAssistantId,
      ) ?? assistant);
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
        assistant={
          previewAssistant.role === 'dental_assistant'
            ? previewAssistant
            : assistant
        }
        secretary={
          previewAssistant.role === 'secretary' ? previewAssistant : secretary
        }
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
          visit={visit}
        />
      )}
      {activeTab === 'handoff' && (
        <DocumentationHandoffPanel
          actor={actor}
          assistants={assistants}
          assignedAssistantName={assignedAssistantName ?? null}
          selectedAssistantId={handoffAssistantId}
          onAssistantChange={setHandoffAssistantId}
          assistantsLoading={sessionStatus === 'loading' || directory.isLoading}
          assistantsError={
            sessionStatus !== 'loading' && !clinicId
              ? 'A signed-in clinic is required to load staff.'
              : directory.isError
                ? 'Unable to load the clinic staff list.'
                : null
          }
          onRetryAssistants={() => {
            void directory.refetch();
          }}
          actions={actions}
          instruction={handoffInstruction}
          onInstructionChange={setHandoffInstruction}
          visit={visit}
        />
      )}
    </div>
  );
}
