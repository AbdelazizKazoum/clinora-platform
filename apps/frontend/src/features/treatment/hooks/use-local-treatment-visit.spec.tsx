import { StrictMode, type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { updatePeriodontalSite } from '../model/periodontal';
import { useLocalTreatmentVisit } from './use-local-treatment-visit';

const strictWrapper = ({ children }: PropsWithChildren) => (
  <StrictMode>{children}</StrictMode>
);

const crown = {
  code: 'CROWN' as const,
  details: [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }],
  target: {
    arch: null,
    kind: 'TOOTH' as const,
    periodontalSites: [],
    surfaces: [],
    toothNumbers: [16],
  },
};

describe('Local treatment visit', () => {
  it('retains queued writes and unique IDs when React replays updates', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    const initialCount = result.current.visit.acts.length;
    act(() => {
      result.current.actions.recordAct(crown);
      result.current.actions.recordAct(crown);
    });
    const acts = result.current.visit.acts;
    expect(acts).toHaveLength(initialCount + 2);
    expect(new Set(acts.map(({ id }) => id)).size).toBe(acts.length);
    expect(result.current.visit.auditHistory).toHaveLength(2);
  });

  it('preserves the visit and reports validation errors', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit());
    const originalVisit = result.current.visit;
    act(() => result.current.actions.recordAct({ ...crown, details: [] }));
    expect(result.current.visit).toBe(originalVisit);
    expect(result.current.feedback?.variant).toBe('danger');
    expect(result.current.feedback?.message).toContain('RESTORATION_MATERIAL');
  });

  it('applies queued periodontal edits to the latest examination', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    act(() => {
      result.current.actions.updatePeriodontalExamination((exam) =>
        updatePeriodontalSite(exam, 16, 'MB', { pd: 4 }),
      );
      result.current.actions.updatePeriodontalExamination((exam) =>
        updatePeriodontalSite(exam, 16, 'DL', { pd: 3 }),
      );
    });
    const tooth = result.current.visit.periodontalExamination?.teeth.find(
      (entry) => entry.toothNumber === 16,
    );
    expect(tooth?.sites.MB?.pd).toBe(4);
    expect(tooth?.sites.DL?.pd).toBe(3);
  });
});
