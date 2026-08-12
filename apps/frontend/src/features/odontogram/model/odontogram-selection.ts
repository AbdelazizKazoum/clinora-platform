import {
  TOOTH_POSITIONS,
  type OdontogramSelection,
  type ToothPosition,
} from './odontogram';

export type ToothSelectionActivationMode = 'replace' | 'toggle';
export type ToothSelectionNavigationKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Escape';

export interface OdontogramSelectionValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

const TOOTH_POSITION_SET: ReadonlySet<ToothPosition> = new Set(TOOTH_POSITIONS);
const TOOTH_POSITION_INDEX: ReadonlyMap<ToothPosition, number> = new Map(
  TOOTH_POSITIONS.map((position, index) => [position, index]),
);
const UPPER_ARCH_LENGTH = 16;

export function validateOdontogramSelection(
  selection: OdontogramSelection,
): OdontogramSelectionValidationResult {
  const selectedPositions = selection.selectedToothPositions;
  const uniquePositions = new Set<ToothPosition>();

  for (const position of selectedPositions) {
    if (!TOOTH_POSITION_SET.has(position)) {
      return { valid: false, reason: `Unknown selected tooth ${position}` };
    }

    if (uniquePositions.has(position)) {
      return { valid: false, reason: `Duplicate selected tooth ${position}` };
    }

    uniquePositions.add(position);
  }

  if (selectedPositions.length === 0) {
    return selection.activeToothPosition === null
      ? { valid: true }
      : {
          valid: false,
          reason: 'An empty selection must not have an active tooth',
        };
  }

  if (
    selection.activeToothPosition === null ||
    !uniquePositions.has(selection.activeToothPosition)
  ) {
    return {
      valid: false,
      reason: 'The active tooth must be one of the selected teeth',
    };
  }

  return { valid: true };
}

export function activateToothSelection(
  selection: OdontogramSelection,
  position: ToothPosition,
  mode: ToothSelectionActivationMode,
): OdontogramSelection {
  if (mode === 'replace') {
    return {
      activeToothPosition: position,
      selectedToothPositions: [position],
    };
  }

  const selectedPositions = new Set(selection.selectedToothPositions);
  if (selectedPositions.has(position)) {
    selectedPositions.delete(position);
    const nextSelectedToothPositions = sortToothPositions([
      ...selectedPositions,
    ]);

    return {
      activeToothPosition:
        selection.activeToothPosition === position
          ? (nextSelectedToothPositions[0] ?? null)
          : selection.activeToothPosition,
      selectedToothPositions: nextSelectedToothPositions,
    };
  }

  selectedPositions.add(position);

  return {
    activeToothPosition: position,
    selectedToothPositions: sortToothPositions([...selectedPositions]),
  };
}

export function navigateToothSelection(
  selection: OdontogramSelection,
  key: ToothSelectionNavigationKey,
): OdontogramSelection {
  if (key === 'Escape') {
    return {
      activeToothPosition: null,
      selectedToothPositions: [],
    };
  }

  const origin =
    selection.activeToothPosition ?? selection.selectedToothPositions[0];
  const nextPosition =
    origin === undefined
      ? TOOTH_POSITIONS[0]
      : getNavigationTarget(origin, key);

  return activateToothSelection(selection, nextPosition, 'replace');
}

export function sortToothPositions(
  positions: readonly ToothPosition[],
): readonly ToothPosition[] {
  return [...positions].sort(
    (left, right) => toothPositionIndex(left) - toothPositionIndex(right),
  );
}

function getNavigationTarget(
  origin: ToothPosition,
  key: Exclude<ToothSelectionNavigationKey, 'Escape'>,
): ToothPosition {
  const originIndex = toothPositionIndex(origin);

  if (key === 'ArrowLeft') {
    return TOOTH_POSITIONS[Math.max(0, originIndex - 1)] ?? origin;
  }

  if (key === 'ArrowRight') {
    return (
      TOOTH_POSITIONS[Math.min(TOOTH_POSITIONS.length - 1, originIndex + 1)] ??
      origin
    );
  }

  if (key === 'ArrowDown') {
    return originIndex < UPPER_ARCH_LENGTH
      ? (TOOTH_POSITIONS[originIndex + UPPER_ARCH_LENGTH] ?? origin)
      : origin;
  }

  return originIndex >= UPPER_ARCH_LENGTH
    ? (TOOTH_POSITIONS[originIndex - UPPER_ARCH_LENGTH] ?? origin)
    : origin;
}

function toothPositionIndex(position: ToothPosition): number {
  const index = TOOTH_POSITION_INDEX.get(position);
  if (index === undefined) {
    throw new Error(`Unknown tooth position ${position}`);
  }

  return index;
}
