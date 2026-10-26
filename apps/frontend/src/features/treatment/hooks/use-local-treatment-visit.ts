'use client';

import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import {
  MOCK_ASSISTANT,
  MOCK_DENTIST,
  MOCK_TREATMENT_PATIENT,
  createMockTreatmentVisit,
} from '../mock/treatment-workspace.mock';
import type {
  ClinicalFindingCode,
  TreatmentActCode,
  TreatmentActStatus,
  TreatmentLaunchContext,
  TreatmentVisit,
} from '../model/treatment';
import {
  createTreatmentActInput,
  createTreatmentFindingInput,
  type TreatmentInputDraft,
} from '../model/treatment-inputs';
import {
  approveWorkspaceAct,
  approveWorkspaceFinding,
  approveWorkspacePeriodontalExamination,
  assignWorkspaceDocumentation,
  completeWorkspaceVisit,
  recordWorkspaceAct,
  recordWorkspaceFinding,
  removeWorkspaceFinding,
  reviewWorkspaceDocumentation,
  startWorkspaceDocumentation,
  submitWorkspaceDocumentation,
  transitionWorkspaceAct,
  updateWorkspacePeriodontalExamination,
  type PeriodontalExaminationUpdater,
} from '../model/treatment-workspace';

type FindingDraft = Omit<TreatmentInputDraft, 'id' | 'code'> & {
  readonly code: ClinicalFindingCode;
};
type ActDraft = Omit<TreatmentInputDraft, 'id' | 'code'> & {
  readonly code: TreatmentActCode;
};

export interface TreatmentVisitActions {
  readonly recordFinding: (input: FindingDraft) => void;
  readonly recordAct: (input: ActDraft) => void;
  readonly approveFinding: (id: string) => void;
  readonly removeFinding: (id: string, reason?: string) => void;
  readonly approveAct: (id: string) => void;
  readonly transitionAct: (id: string, status: TreatmentActStatus) => void;
  readonly assignDocumentation: (assistantId: string, instruction: string) => void;
  readonly startDocumentation: () => void;
  readonly submitDocumentation: () => void;
  readonly reviewDocumentation: (decision: 'ACCEPT' | 'RETURN') => void;
  readonly completeVisit: () => void;
  readonly updatePeriodontalExamination: (
    update: PeriodontalExaminationUpdater,
  ) => void;
  readonly approvePeriodontalExamination: () => void;
}

export interface TreatmentFeedback {
  readonly message: string;
  readonly variant: 'success' | 'warning' | 'danger' | 'info';
}
interface VisitState {
  readonly visit: TreatmentVisit;
  readonly feedback: TreatmentFeedback | null;
}
type VisitAction =
  | { readonly type: 'feedback'; readonly feedback: TreatmentFeedback | null }
  | {
      readonly type: 'update';
      readonly update: (visit: TreatmentVisit) => TreatmentVisit;
      readonly message: string;
    };

// Commit data and feedback together. Reducer replay has no setters, ID generation,
// or clock reads, including when React Strict Mode replays an update.
function reduceVisit(state: VisitState, action: VisitAction): VisitState {
  if (action.type === 'feedback')
    return { ...state, feedback: action.feedback };
  try {
    return {
      visit: action.update(state.visit),
      feedback: { message: action.message, variant: 'success' },
    };
  } catch (error) {
    return {
      ...state,
      feedback: {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update the visit.',
        variant: 'danger',
      },
    };
  }
}

/** Local-only adapter. Replace with BFF query/mutation hooks when persistence is added. */
export function useLocalTreatmentVisit(
  launchContext?: TreatmentLaunchContext | null,
) {
  const dentist = useMemo(
    () => ({
      ...MOCK_DENTIST,
      userId: launchContext?.doctorId ?? MOCK_DENTIST.userId,
    }),
    [launchContext?.doctorId],
  );
  const [actor, setActor] = useState(dentist);
  const [state, dispatch] = useReducer(
    reduceVisit,
    launchContext,
    (context): VisitState => ({
      visit: createMockTreatmentVisit({
        appointmentId: context?.appointmentId ?? undefined,
        chairId: context?.chairId ?? undefined,
        doctorId: context?.doctorId ?? undefined,
        patientId: context?.patientId ?? undefined,
        queueEntryId: context?.queueEntryId ?? undefined,
      }),
      feedback: null,
    }),
  );
  const idCounter = useRef(1);
  const showFeedback = useCallback(
    (feedback: TreatmentFeedback | null) =>
      dispatch({ type: 'feedback', feedback }),
    [],
  );
  const actions = useMemo<TreatmentVisitActions>(() => {
    const nextId = (prefix: string) => `${prefix}-mock-${idCounter.current++}`;
    const run = (
      update: (visit: TreatmentVisit, now: Date) => TreatmentVisit,
      message: string,
    ) => {
      const now = new Date();
      dispatch({
        type: 'update',
        update: (visit) => update(visit, now),
        message,
      });
    };
    return {
      recordFinding: (input) => {
        const id = nextId('finding');
        run(
          (visit, now) =>
            recordWorkspaceFinding(
              visit,
              actor,
              createTreatmentFindingInput({ ...input, id }),
              now,
            ),
          actor.role === 'doctor'
            ? 'Clinical finding confirmed and added to the chart.'
            : 'Draft finding added for dentist review.',
        );
      },
      recordAct: (input) => {
        const id = nextId('act');
        run(
          (visit, now) =>
            recordWorkspaceAct(
              visit,
              actor,
              createTreatmentActInput({ ...input, id }),
              now,
            ),
          actor.role === 'doctor'
            ? 'Treatment act planned and projected on the odontogram where supported.'
            : 'Draft treatment act added for dentist approval.',
        );
      },
      approveFinding: (id) =>
        run(
          (visit, now) => approveWorkspaceFinding(visit, actor, id, now),
          'Clinical finding confirmed.',
        ),
      removeFinding: (id, reason) =>
        run(
          (visit, now) => removeWorkspaceFinding(visit, actor, id, reason, now),
          'Clinical finding removed from the active chart.',
        ),
      approveAct: (id) =>
        run(
          (visit, now) => approveWorkspaceAct(visit, actor, id, now),
          'Treatment act approved.',
        ),
      transitionAct: (id, status) =>
        run(
          (visit, now) => transitionWorkspaceAct(visit, actor, id, status, now),
          treatmentActTransitionMessage(status),
        ),
      assignDocumentation: (assistantId, instruction) => {
        const id = nextId('handoff');
        run(
          (visit, now) =>
            assignWorkspaceDocumentation(
              visit,
              actor,
              assistantId,
              id,
              instruction,
              now,
            ),
          'Documentation assigned to the assistant.',
        );
      },
      startDocumentation: () =>
        run(
          (visit, now) => startWorkspaceDocumentation(visit, actor, now),
          'Documentation session started.',
        ),
      submitDocumentation: () =>
        run(
          (visit, now) => submitWorkspaceDocumentation(visit, actor, now),
          'Documentation submitted for dentist review.',
        ),
      reviewDocumentation: (decision) =>
        run(
          (visit, now) =>
            reviewWorkspaceDocumentation(visit, actor, decision, now),
          decision === 'ACCEPT'
            ? 'Assistant documentation accepted.'
            : 'Documentation returned for correction.',
        ),
      completeVisit: () =>
        run(
          (visit, now) => completeWorkspaceVisit(visit, actor, now),
          'Visit completed and locked.',
        ),
      updatePeriodontalExamination: (update) =>
        run(
          (visit, now) =>
            updateWorkspacePeriodontalExamination(visit, actor, update, now),
          'Periodontal examination updated.',
        ),
      approvePeriodontalExamination: () =>
        run(
          (visit, now) =>
            approveWorkspacePeriodontalExamination(visit, actor, now),
          'Periodontal examination confirmed.',
        ),
    };
  }, [actor]);
  return {
    ...state,
    actor,
    setActor,
    dentist,
    assistant: MOCK_ASSISTANT,
    patient: MOCK_TREATMENT_PATIENT,
    actions,
    showFeedback,
  };
}

const treatmentActTransitionMessage = (status: TreatmentActStatus) =>
  status === 'IN_PROGRESS'
    ? 'Treatment act started.'
    : status === 'COMPLETED'
      ? 'Treatment act completed and updated on the odontogram.'
      : status === 'CANCELLED'
        ? 'Treatment act cancelled and removed from the projection.'
        : 'Treatment act updated.';
