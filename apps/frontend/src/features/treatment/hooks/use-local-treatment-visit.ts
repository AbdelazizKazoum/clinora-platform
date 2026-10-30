'use client';

import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import {
  MOCK_ASSISTANT,
  MOCK_SECRETARY,
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
  TreatmentSessionOutcome,
} from '../model/treatment';
import {
  createTreatmentActInput,
  createTreatmentFindingInput,
  type TreatmentInputDraft,
} from '../model/treatment-inputs';
import {
  assignWorkspaceDocumentation,
  recordWorkspaceAct,
  recordWorkspaceFinding,
  removeWorkspaceFinding,
  startWorkspaceDocumentation,
  updateWorkspacePeriodontalExamination,
  type PeriodontalExaminationUpdater,
} from '../model/treatment-workspace';

import {
  canRemoveLocalTreatmentPlan,
  closeLocalTreatmentSession,
  completeLocalTreatmentVisit,
  createLocalTreatmentRecord,
  createNextLocalTreatmentVisit,
  getLocalTreatmentVisit,
  removeLocalTreatmentPlan,
  selectLocalTreatmentVisit,
  startLocalTreatmentSession,
  transitionLocalTreatmentPlan,
  updateLocalTreatmentVisit,
  type LocalTreatmentRecord,
} from '../model/local-treatment-record';

type FindingDraft = Omit<TreatmentInputDraft, 'id' | 'code'> & {
  readonly code: ClinicalFindingCode;
};
type ActDraft = Omit<TreatmentInputDraft, 'id' | 'code'> & {
  readonly code: TreatmentActCode;
};

export interface TreatmentVisitActions {
  readonly recordFinding: (input: FindingDraft) => void;
  readonly recordAct: (input: ActDraft) => void;
  readonly removeFinding: (id: string, reason?: string) => void;
  readonly removeAct: (id: string) => void;
  readonly transitionAct: (
    id: string,
    status: TreatmentActStatus,
    reason?: string,
  ) => void;
  readonly closeSession: (
    id: string,
    outcome: TreatmentSessionOutcome,
    note: string,
  ) => void;
  readonly selectVisit: (id: string) => void;
  readonly createNextVisit: () => void;
  readonly assignDocumentation: (
    assistantId: string,
    instruction: string,
    assigneeRole?: 'dental_assistant' | 'secretary',
  ) => void;
  readonly startDocumentation: () => void;
  readonly completeVisit: () => void;
  readonly updatePeriodontalExamination: (
    update: PeriodontalExaminationUpdater,
  ) => void;
}

export interface TreatmentFeedback {
  readonly message: string;
  readonly variant: 'success' | 'warning' | 'danger' | 'info';
}
interface VisitState {
  readonly data: LocalTreatmentRecord;
  readonly feedback: TreatmentFeedback | null;
}
type VisitAction =
  | { readonly type: 'feedback'; readonly feedback: TreatmentFeedback | null }
  | {
      readonly type: 'update';
      readonly update: (data: LocalTreatmentRecord) => LocalTreatmentRecord;
      readonly message: string;
    };

// Commit data and feedback together. Reducer replay has no setters, ID generation,
// or clock reads, including when React Strict Mode replays an update.
function reduceVisit(state: VisitState, action: VisitAction): VisitState {
  if (action.type === 'feedback')
    return { ...state, feedback: action.feedback };
  try {
    return {
      data: action.update(state.data),
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
      data: createLocalTreatmentRecord(
        createMockTreatmentVisit({
          appointmentId: context?.appointmentId ?? undefined,
          chairId: context?.chairId ?? undefined,
          doctorId: context?.doctorId ?? undefined,
          patientId: context?.patientId ?? undefined,
          queueEntryId: context?.queueEntryId ?? undefined,
        }),
      ),
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
    const runRecord = (
      update: (data: LocalTreatmentRecord, now: Date) => LocalTreatmentRecord,
      message: string,
    ) => {
      const now = new Date();
      dispatch({
        type: 'update',
        update: (data) => update(data, now),
        message,
      });
    };
    const run = (
      update: (visit: TreatmentVisit, now: Date) => TreatmentVisit,
      message: string,
    ) =>
      runRecord(
        (data, now) =>
          updateLocalTreatmentVisit(data, (visit) => update(visit, now)),
        message,
      );
    return {
      selectVisit: (id) =>
        runRecord(
          (data) => selectLocalTreatmentVisit(data, id),
          'Visit opened.',
        ),
      createNextVisit: () => {
        const id = nextId('visit');
        runRecord(
          (data, now) => createNextLocalTreatmentVisit(data, actor, id, now),
          'New visit started. Select an existing plan to continue treatment.',
        );
      },
      closeSession: (id, outcome, note) => {
        const expectedVersion =
          state.data.sessions.find((session) => session.id === id)?.version ??
          -1;
        runRecord(
          (data, now) =>
            closeLocalTreatmentSession(
              data,
              actor,
              { sessionId: id, outcome, note, expectedVersion },
              now,
            ),
          outcome === 'CONTINUE_LATER'
            ? 'Session closed. Treatment remains active for a later visit.'
            : 'Treatment act completed and updated on the odontogram.',
        );
      },
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
          'Clinical finding confirmed and added to the chart.',
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
          'Treatment act planned and projected on the odontogram where supported.',
        );
      },
      removeFinding: (id, reason) =>
        run(
          (visit, now) => removeWorkspaceFinding(visit, actor, id, reason, now),
          'Clinical finding removed from the active chart.',
        ),
      removeAct: (id) => {
        const expectedVersion =
          state.data.planItems.find((plan) => plan.id === id)?.version ?? -1;
        runRecord(
          (data, now) =>
            removeLocalTreatmentPlan(
              data,
              actor,
              { planItemId: id, expectedVersion },
              now,
            ),
          'Unstarted treatment plan removed.',
        );
      },
      transitionAct: (id, status, reason) => {
        if (status === 'IN_PROGRESS') {
          const sessionId = nextId('session');
          const expectedVersion =
            state.data.planItems.find((plan) => plan.id === id)?.version ?? -1;
          runRecord(
            (data, now) =>
              startLocalTreatmentSession(
                data,
                actor,
                { planItemId: id, sessionId, expectedVersion },
                now,
              ),
            'Treatment session started.',
          );
        } else {
          runRecord((data, now) => {
            if (status !== 'CANCELLED' && status !== 'ENTERED_IN_ERROR')
              throw new Error('Use session closure to finish treatment.');
            return transitionLocalTreatmentPlan(
              data,
              actor,
              id,
              status,
              reason ?? '',
              now,
            );
          }, 'Treatment plan updated.');
        }
      },
      assignDocumentation: (assistantId, instruction, assigneeRole) => {
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
              assigneeRole,
            ),
          'Visit documentation assigned.',
        );
      },
      startDocumentation: () =>
        run(
          (visit, now) => startWorkspaceDocumentation(visit, actor, now),
          'Documentation session started.',
        ),
      completeVisit: () =>
        runRecord(
          (data, now) => completeLocalTreatmentVisit(data, actor, now),
          'Visit completed and locked.',
        ),
      updatePeriodontalExamination: (update) =>
        run(
          (visit, now) =>
            updateWorkspacePeriodontalExamination(visit, actor, update, now),
          'Periodontal examination updated.',
        ),
    };
  }, [actor, state.data.planItems, state.data.sessions]);
  const visit = useMemo(
    () => ({
      ...getLocalTreatmentVisit(state.data),
      treatmentSessions: state.data.sessions.filter(
        ({ visitId }) => visitId === state.data.currentVisitId,
      ),
    }),
    [state.data],
  );
  const planItems = useMemo(
    () => state.data.planItems.filter((plan) => !plan.removedAt),
    [state.data.planItems],
  );
  const removablePlanIds = useMemo(
    () =>
      new Set(
        planItems
          .filter((plan) =>
            canRemoveLocalTreatmentPlan(state.data, actor, plan.id),
          )
          .map(({ id }) => id),
      ),
    [state.data, actor, planItems],
  );
  return {
    visit,
    visits: state.data.visits,
    planItems,
    removablePlanIds,
    sessions: state.data.sessions,
    feedback: state.feedback,
    actor,
    setActor,
    dentist,
    assistant: MOCK_ASSISTANT,
    secretary: MOCK_SECRETARY,
    patient: { ...MOCK_TREATMENT_PATIENT, id: visit.patientId },
    actions,
    showFeedback,
  };
}
