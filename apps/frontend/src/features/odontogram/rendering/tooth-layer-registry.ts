import type {
  FillingMaterial,
  OdontogramAppearance,
  OdontogramCondition,
  OdontogramTooth,
  ToothPosition,
  ToothSurface,
} from '../model/odontogram';
import type { ToothSvgTemplateView } from './svg-template-loader';
import { hasOcclusalToothView } from './tooth-layout';

export type ToothSurfaceLayerKind = 'caries' | 'subcaries' | 'filling';

export interface ToothSurfaceVisualLayer {
  readonly id: string;
  readonly kind: ToothSurfaceLayerKind;
  readonly surface: ToothSurface;
  readonly appearance: OdontogramAppearance;
  readonly severity?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface UnsupportedToothSurfaceVisual {
  readonly surface: ToothSurface;
  readonly reason: 'unsupported-template-surface';
}

export interface ToothSurfaceVisualLayerResult {
  readonly layers: readonly ToothSurfaceVisualLayer[];
  readonly unsupportedSurfaces: readonly UnsupportedToothSurfaceVisual[];
}

const TOOTH_SURFACES: readonly ToothSurface[] = [
  'buccal',
  'lingual',
  'mesial',
  'distal',
  'occlusal',
];

const FILLING_MATERIALS: readonly FillingMaterial[] = [
  'amalgam',
  'composite',
  'gic',
  'temporary',
];

export const TOOTH_SURFACE_LAYER_RESET_IDS = Object.freeze([
  ...TOOTH_SURFACES.map((surface) => `caries-${surface}`),
  ...TOOTH_SURFACES.map((surface) => `subcaries-${surface}`),
  ...FILLING_MATERIALS.flatMap((material) =>
    TOOTH_SURFACES.map((surface) => `filling-${material}-${surface}`),
  ),
] as const);

export const FILLING_SURFACE_LAYER_ID_BY_MATERIAL = Object.freeze(
  Object.fromEntries(
    FILLING_MATERIALS.map((material) => [
      material,
      Object.freeze(
        Object.fromEntries(
          TOOTH_SURFACES.map((surface) => [
            surface,
            `filling-${material}-${surface}`,
          ]),
        ) as Record<ToothSurface, `filling-${FillingMaterial}-${ToothSurface}`>,
      ),
    ]),
  ) as Record<
    FillingMaterial,
    Readonly<Record<ToothSurface, `filling-${FillingMaterial}-${ToothSurface}`>>
  >,
);

export function deriveToothSurfaceVisualLayers(
  tooth: OdontogramTooth,
  view: ToothSvgTemplateView,
): ToothSurfaceVisualLayerResult {
  const fillingsBySurface = collectSurfaceConditions(tooth, 'filling');
  const cariesBySurface = collectSurfaceConditions(tooth, 'caries');
  const layers: ToothSurfaceVisualLayer[] = [];
  const unsupportedSurfaces = new Set<ToothSurface>();

  for (const filling of fillingsBySurface.values()) {
    if (!isSurfaceSupportedByToothView(tooth.position, view, filling.surface)) {
      unsupportedSurfaces.add(filling.surface);
      continue;
    }

    layers.push({
      appearance: filling.appearance,
      id: FILLING_SURFACE_LAYER_ID_BY_MATERIAL[filling.material][
        filling.surface
      ],
      kind: 'filling',
      surface: filling.surface,
    });
  }

  for (const caries of cariesBySurface.values()) {
    if (!isSurfaceSupportedByToothView(tooth.position, view, caries.surface)) {
      unsupportedSurfaces.add(caries.surface);
      continue;
    }

    const filling = fillingsBySurface.get(caries.surface);
    layers.push({
      appearance: caries.appearance,
      id:
        filling === undefined
          ? `caries-${caries.surface}`
          : `subcaries-${caries.surface}`,
      kind: filling === undefined ? 'caries' : 'subcaries',
      severity: caries.severity,
      surface: caries.surface,
    });
  }

  return {
    layers,
    unsupportedSurfaces: [...unsupportedSurfaces].map((surface) => ({
      reason: 'unsupported-template-surface',
      surface,
    })),
  };
}

export function isSurfaceSupportedByToothView(
  toothPosition: ToothPosition,
  view: ToothSvgTemplateView,
  surface: ToothSurface,
): boolean {
  if (view === 'side') {
    return surface !== 'lingual';
  }

  return hasOcclusalToothView(toothPosition);
}

function collectSurfaceConditions<K extends 'caries' | 'filling'>(
  tooth: OdontogramTooth,
  kind: K,
): ReadonlyMap<
  ToothSurface,
  Extract<OdontogramCondition, { readonly kind: K }>
> {
  const conditionsBySurface = new Map<
    ToothSurface,
    Extract<OdontogramCondition, { readonly kind: K }>
  >();

  for (const condition of tooth.conditions) {
    if (condition.kind === kind) {
      conditionsBySurface.set(
        condition.surface,
        condition as Extract<OdontogramCondition, { readonly kind: K }>,
      );
    }
  }

  return conditionsBySurface;
}
