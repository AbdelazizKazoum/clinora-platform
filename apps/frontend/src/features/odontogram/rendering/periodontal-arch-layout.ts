export type PeriodontalArch = 'upper' | 'lower';
export type PeriodontalAspect = 'buccal' | 'lingual';

export interface PeriodontalArchToothLayout {
  readonly toothNumber: number;
  readonly x: number;
  readonly y: number;
  readonly arch: PeriodontalArch;
  readonly aspect: PeriodontalAspect;
}

export const PERIODONTAL_UPPER_ARCH: readonly number[] = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];

export const PERIODONTAL_LOWER_ARCH: readonly number[] = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export const buildPeriodontalArchLayout = (
  arch: PeriodontalArch,
  aspect: PeriodontalAspect,
  width = 640,
): readonly PeriodontalArchToothLayout[] => {
  const teeth = arch === 'upper' ? PERIODONTAL_UPPER_ARCH : PERIODONTAL_LOWER_ARCH;
  const padding = 24;
  const step = (width - padding * 2) / (teeth.length - 1);
  const y = aspect === 'buccal'
    ? arch === 'upper' ? 48 : 112
    : arch === 'upper' ? 112 : 48;
  return teeth.map((toothNumber, index) => ({
    arch,
    aspect,
    toothNumber,
    x: padding + index * step,
    y,
  }));
};

export const buildPeriodontalCurvePoints = (
  layout: readonly PeriodontalArchToothLayout[],
  values: ReadonlyMap<number, number | null>,
  baseline: number,
  millimetersInPixels = 7,
): string =>
  layout
    .filter(({ toothNumber }) => values.get(toothNumber) !== null && values.get(toothNumber) !== undefined)
    .map(({ toothNumber, x, y }) => `${x},${y + baseline + (values.get(toothNumber) ?? 0) * millimetersInPixels}`)
    .join(' ');
