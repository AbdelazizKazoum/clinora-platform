import type { ToothPosition, ToothSurface } from '../model/odontogram';

export interface ToothSurfaceNotation {
  readonly surface: ToothSurface;
  readonly label: string;
  readonly shortLabel: string;
  readonly ariaLabel: string;
}

const ANTERIOR_POSITIONS: ReadonlySet<ToothPosition> = new Set([
  13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33,
]);

const UPPER_POSITIONS: ReadonlySet<ToothPosition> = new Set([
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
]);

export function getToothSurfaceNotation(
  toothPosition: ToothPosition,
  surface: ToothSurface,
): ToothSurfaceNotation {
  const label = getToothSurfaceLabel(toothPosition, surface);

  return {
    ariaLabel: `${label} surface`,
    label,
    shortLabel: getToothSurfaceShortLabel(label),
    surface,
  };
}

export function getToothSurfaceLabel(
  toothPosition: ToothPosition,
  surface: ToothSurface,
): string {
  if (surface === 'buccal' && isAnteriorTooth(toothPosition)) {
    return 'Labial';
  }

  if (surface === 'lingual' && isUpperTooth(toothPosition)) {
    return 'Palatal';
  }

  if (surface === 'occlusal' && isAnteriorTooth(toothPosition)) {
    return 'Incisal';
  }

  return capitalizeSurface(surface);
}

export function isAnteriorTooth(toothPosition: ToothPosition): boolean {
  return ANTERIOR_POSITIONS.has(toothPosition);
}

export function isUpperTooth(toothPosition: ToothPosition): boolean {
  return UPPER_POSITIONS.has(toothPosition);
}

function getToothSurfaceShortLabel(label: string): string {
  if (label === 'Labial') {
    return 'La';
  }

  return label[0] ?? '';
}

function capitalizeSurface(surface: ToothSurface): string {
  return `${surface[0]?.toUpperCase() ?? ''}${surface.slice(1)}`;
}
