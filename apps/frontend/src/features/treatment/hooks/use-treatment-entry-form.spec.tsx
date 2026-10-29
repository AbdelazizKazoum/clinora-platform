import { act, renderHook } from '@testing-library/react';
import type {
  OdontogramCondition,
  OdontogramData,
} from '@/features/odontogram';
import { useTreatmentEntryForm } from './use-treatment-entry-form';

const existingCrown: OdontogramCondition = {
  kind: 'restoration',
  restoration: 'crown',
  material: 'metal',
  appearance: 'existing',
};

const chart = (
  conditions17: readonly OdontogramCondition[] = [],
  conditions18: readonly OdontogramCondition[] = [],
): OdontogramData => ({
  teeth: [
    {
      position: 17,
      base: 'natural',
      dentition: 'permanent',
      conditions: conditions17,
    },
    {
      position: 18,
      base: 'natural',
      dentition: 'permanent',
      conditions: conditions18,
    },
  ],
});

function setup(data: OdontogramData) {
  const actions = { recordAct: jest.fn(), recordFinding: jest.fn() };
  const { result } = renderHook(() =>
    useTreatmentEntryForm({ actions, data, showFeedback: jest.fn() }),
  );
  act(() => {
    result.current.setSelection({
      activeToothPosition: 18,
      selectedToothPositions: [18, 17],
    });
    result.current.onActCodeChange('CROWN_REPLACEMENT');
  });
  return { result, actions };
}

describe('Crown replacement entry prerequisites', () => {
  it('blocks healthy teeth 18 and 17 and retains the form after dismissal', () => {
    const { result, actions } = setup(chart());
    act(() => result.current.onNoteChange('Replace worn crowns.'));
    act(() => result.current.onAddAct());
    expect(actions.recordAct).not.toHaveBeenCalled();
    expect(result.current.crownValidationError?.requirement).toContain(
      '18, 17',
    );
    act(() => result.current.onCloseCrownValidationError());
    expect(result.current.crownValidationError).toBeNull();
    expect(result.current.note).toBe('Replace worn crowns.');
    expect(result.current.selection.selectedToothPositions).toEqual([18, 17]);
  });

  it('blocks the entire act when only one selected tooth has an existing crown', () => {
    const { result, actions } = setup(chart([existingCrown]));
    act(() => result.current.onAddAct());
    expect(actions.recordAct).not.toHaveBeenCalled();
    expect(result.current.crownValidationError?.requirement).toContain(
      'teeth 18.',
    );
  });

  it.each([
    { ...existingCrown, appearance: 'planned' as const },
    { ...existingCrown, restoration: 'inlay' as const },
  ])(
    'does not accept a planned crown or another restoration ($appearance $restoration)',
    (condition) => {
      const { result, actions } = setup(chart([condition], [condition]));
      act(() => result.current.onAddAct());
      expect(actions.recordAct).not.toHaveBeenCalled();
      expect(result.current.crownValidationError).not.toBeNull();
    },
  );

  it('records one replacement targeting both teeth when both have existing crowns', () => {
    const { result, actions } = setup(chart([existingCrown], [existingCrown]));
    act(() => result.current.onAddAct());
    expect(result.current.crownValidationError).toBeNull();
    expect(actions.recordAct).toHaveBeenCalledTimes(1);
    expect(actions.recordAct).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CROWN_REPLACEMENT',
        target: expect.objectContaining({ toothNumbers: [18, 17] }),
      }),
    );
  });

  it('still allows planning first crowns on healthy teeth', () => {
    const { result, actions } = setup(chart());
    act(() => result.current.onActCodeChange('CROWN'));
    act(() => result.current.onAddAct());
    expect(actions.recordAct).toHaveBeenCalledTimes(1);
    expect(result.current.crownValidationError).toBeNull();
  });
});
