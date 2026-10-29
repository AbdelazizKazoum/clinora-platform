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
  const showFeedback = jest.fn();
  const { result } = renderHook(() =>
    useTreatmentEntryForm({ actions, data, showFeedback }),
  );
  act(() => {
    result.current.setSelection({
      activeToothPosition: 18,
      selectedToothPositions: [18, 17],
    });
    result.current.onActCodeChange('CROWN_REPLACEMENT');
  });
  return { result, actions, showFeedback };
}

describe('Finding selection scope', () => {
  it('records an existing crown on every selected tooth with the same material and note', () => {
    const { result, actions } = setup(chart());
    act(() => {
      result.current.onFindingCodeChange('EXISTING_FIXED_RESTORATION');
      result.current.onRestorationMaterialChange('METAL');
      result.current.onNoteChange('Existing metal crowns.');
    });
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).toHaveBeenCalledTimes(1);
    expect(actions.recordFinding).toHaveBeenCalledWith({
      code: 'EXISTING_FIXED_RESTORATION',
      details: [
        { key: 'RESTORATION_TYPE', value: 'CROWN' },
        { key: 'RESTORATION_MATERIAL', value: 'METAL' },
      ],
      note: 'Existing metal crowns.',
      target: {
        arch: null,
        kind: 'TOOTH',
        periodontalSites: [],
        surfaces: [],
        toothNumbers: [18, 17],
      },
    });
    expect(result.current.note).toBe('');
  });

  it('uses the selected surfaces and severity for caries on every selected tooth', () => {
    const { result, actions } = setup(chart());
    act(() => {
      result.current.onFindingCodeChange('CARIES');
      result.current.onFindingDetailChange('5');
      result.current.onSurfacesChange(['mesial', 'occlusal']);
    });
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CARIES',
        details: expect.arrayContaining([
          { key: 'ICDAS_CARS_SEVERITY', value: 5 },
        ]),
        target: expect.objectContaining({
          kind: 'TOOTH_SURFACE',
          surfaces: ['MESIAL', 'OCCLUSAL'],
          toothNumbers: [18, 17],
        }),
      }),
    );
  });

  it('keeps periodontal probing specific to the active tooth and chosen site', () => {
    const { result, actions } = setup(chart());
    act(() => {
      result.current.onFindingCodeChange('PERIODONTAL_MEASUREMENT');
      result.current.onFindingDetailChange('6');
      result.current.onPeriodontalSiteChange('ML');
    });
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'PERIODONTAL_MEASUREMENT',
        details: [{ key: 'PROBING_DEPTH_MM', value: 6 }],
        target: expect.objectContaining({
          kind: 'PERIODONTAL_SITE',
          periodontalSites: ['ML'],
          toothNumbers: [18],
        }),
      }),
    );
  });

  it('records an existing bridge as one complete validated span', () => {
    const { result, actions } = setup({
      teeth: chart().teeth.map((tooth) =>
        tooth.position === 18 ? { ...tooth, base: 'missing' } : tooth,
      ),
    });
    act(() => result.current.onFindingCodeChange('EXISTING_FIXED_RESTORATION'));
    act(() => result.current.onFindingDetailChange('BRIDGE'));
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).toHaveBeenCalledTimes(1);
    expect(actions.recordFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          kind: 'BRIDGE_SPAN',
          toothNumbers: [18, 17],
        }),
      }),
    );
  });

  it('still rejects an existing bridge when the selected span has no missing tooth', () => {
    const { result, actions, showFeedback } = setup(chart());
    act(() => result.current.onFindingCodeChange('EXISTING_FIXED_RESTORATION'));
    act(() => result.current.onFindingDetailChange('BRIDGE'));
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).not.toHaveBeenCalled();
    expect(showFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
        message: expect.stringContaining('at least one missing tooth'),
      }),
    );
  });

  it('requires a selection instead of recording against a stale active tooth', () => {
    const { result, actions, showFeedback } = setup(chart());
    act(() =>
      result.current.setSelection({
        activeToothPosition: 18,
        selectedToothPositions: [],
      }),
    );
    act(() => result.current.onAddFinding());
    expect(actions.recordFinding).not.toHaveBeenCalled();
    expect(showFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'warning' }),
    );
  });
});

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
