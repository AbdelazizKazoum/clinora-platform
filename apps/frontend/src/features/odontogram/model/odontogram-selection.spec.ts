import type { OdontogramSelection } from './odontogram';
import {
  activateToothSelection,
  navigateToothSelection,
  sortToothPositions,
  validateOdontogramSelection,
} from './odontogram-selection';

describe('odontogram-selection', () => {
  it('replaces selection on normal activation', () => {
    expect(
      activateToothSelection(
        { activeToothPosition: 18, selectedToothPositions: [18, 17] },
        11,
        'replace',
      ),
    ).toEqual({
      activeToothPosition: 11,
      selectedToothPositions: [11],
    });
  });

  it('adds a modifier-toggle position and makes the newly added tooth active', () => {
    expect(
      activateToothSelection(
        { activeToothPosition: 18, selectedToothPositions: [18] },
        11,
        'toggle',
      ),
    ).toEqual({
      activeToothPosition: 11,
      selectedToothPositions: [18, 11],
    });
  });

  it('removes a modifier-toggle position and falls back to canonical active order', () => {
    expect(
      activateToothSelection(
        { activeToothPosition: 18, selectedToothPositions: [18, 11, 48] },
        18,
        'toggle',
      ),
    ).toEqual({
      activeToothPosition: 11,
      selectedToothPositions: [11, 48],
    });
  });

  it('clears active when the last selected position is toggled off', () => {
    expect(
      activateToothSelection(
        { activeToothPosition: 18, selectedToothPositions: [18] },
        18,
        'toggle',
      ),
    ).toEqual({
      activeToothPosition: null,
      selectedToothPositions: [],
    });
  });

  it('navigates arrows deterministically across arch order', () => {
    expect(navigateToothSelection(selection(18), 'ArrowRight')).toEqual(
      selection(17),
    );
    expect(navigateToothSelection(selection(17), 'ArrowLeft')).toEqual(
      selection(18),
    );
    expect(navigateToothSelection(selection(18), 'ArrowDown')).toEqual(
      selection(48),
    );
    expect(navigateToothSelection(selection(48), 'ArrowUp')).toEqual(
      selection(18),
    );
    expect(navigateToothSelection(selection(38), 'ArrowRight')).toEqual(
      selection(38),
    );
  });

  it('starts keyboard navigation at the first canonical tooth when empty', () => {
    expect(
      navigateToothSelection(
        { activeToothPosition: null, selectedToothPositions: [] },
        'ArrowRight',
      ),
    ).toEqual(selection(18));
  });

  it('clears selection on Escape', () => {
    expect(navigateToothSelection(selection(18), 'Escape')).toEqual({
      activeToothPosition: null,
      selectedToothPositions: [],
    });
  });

  it('sorts positions by canonical arch order', () => {
    expect(sortToothPositions([31, 18, 11, 48])).toEqual([18, 11, 48, 31]);
  });

  it.each([
    [
      'valid empty',
      { activeToothPosition: null, selectedToothPositions: [] },
      true,
    ],
    ['valid single', selection(18), true],
    [
      'duplicate selected',
      { activeToothPosition: 18, selectedToothPositions: [18, 18] },
      false,
    ],
    [
      'active missing from selection',
      { activeToothPosition: 18, selectedToothPositions: [17] },
      false,
    ],
    [
      'active with empty selection',
      { activeToothPosition: 18, selectedToothPositions: [] },
      false,
    ],
  ] as const)('validates %s selection', (_label, input, valid) => {
    expect(validateOdontogramSelection(input).valid).toBe(valid);
  });
});

function selection(position: 18 | 17 | 48 | 38): OdontogramSelection {
  return {
    activeToothPosition: position,
    selectedToothPositions: [position],
  };
}
