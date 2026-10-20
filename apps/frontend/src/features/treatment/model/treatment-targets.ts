import {
  TOOTH_POSITIONS,
  type ToothPosition,
  type ToothSurface,
  type OdontogramData,
} from '@/features/odontogram';
import type { TreatmentCatalogueTarget } from './treatment-catalogue';
import type {
  PeriodontalSite,
  ToothSurface as TreatmentSurface,
} from './treatment';

export const buildTarget = (
  target: TreatmentCatalogueTarget,
  toothNumbers: readonly ToothPosition[],
  surfaces: readonly ToothSurface[],
  periodontalSite: PeriodontalSite,
) => ({
  arch:
    target === 'arch'
      ? toothNumbers[0] && toothNumbers[0] < 30
        ? ('UPPER' as const)
        : ('LOWER' as const)
      : null,
  kind:
    target === 'surface'
      ? ('TOOTH_SURFACE' as const)
      : target === 'index-surface'
        ? ('INDEX_SURFACE' as const)
        : target === 'tooth-region'
          ? ('TOOTH_REGION' as const)
          : target === 'bridge'
            ? ('BRIDGE_SPAN' as const)
            : target === 'arch'
              ? ('ARCH' as const)
              : target === 'periodontal'
                ? ('PERIODONTAL_SITE' as const)
                : ('TOOTH' as const),
  periodontalSites: target === 'periodontal' ? [periodontalSite] : [],
  surfaces: (target === 'surface' || target === 'tooth-region'
    ? surfaces.map((surface) => surface.toUpperCase())
    : []) as TreatmentSurface[],
  toothNumbers,
});

export const requiresSurface = (target?: TreatmentCatalogueTarget) =>
  target === 'surface' ||
  target === 'index-surface' ||
  target === 'tooth-region';

export const validateBridgeSelection = (
  positions: readonly ToothPosition[],
  data: OdontogramData,
): string | null => {
  if (positions.length < 2) return 'Select at least two teeth for a bridge.';
  const indices = positions
    .map((position) => TOOTH_POSITIONS.indexOf(position))
    .sort((left, right) => left - right);
  const sameArch =
    indices.every((index) => index < 16) ||
    indices.every((index) => index >= 16);
  if (!sameArch) return 'A bridge cannot cross between upper and lower arches.';
  if (
    indices.some(
      (index, offset) => offset > 0 && index !== indices[offset - 1] + 1,
    )
  ) {
    return 'Bridge teeth must form one contiguous span.';
  }
  const hasPontic = positions.some(
    (position) =>
      data.teeth.find((tooth) => tooth.position === position)?.base ===
      'missing',
  );
  return hasPontic
    ? null
    : 'Select a span containing at least one missing tooth for the pontic.';
};
