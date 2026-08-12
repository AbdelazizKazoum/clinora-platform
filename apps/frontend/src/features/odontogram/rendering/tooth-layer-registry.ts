import type {
  FillingMaterial,
  OdontogramAppearance,
  OdontogramCondition,
  OdontogramTooth,
  ToothBase,
  ToothPosition,
  ToothSurface,
} from '../model/odontogram';
import type { ToothSvgTemplateView } from './svg-template-loader';
import { hasOcclusalToothView } from './tooth-layout';

export type ToothSurfaceLayerKind = 'caries' | 'subcaries' | 'filling';
export type ToothWholeLayerKind = 'base' | 'endodontic' | 'extraction';
export type ToothVisualLayer = ToothSurfaceVisualLayer | ToothWholeVisualLayer;

export interface ToothSurfaceVisualLayer {
  readonly id: string;
  readonly kind: ToothSurfaceLayerKind;
  readonly surface: ToothSurface;
  readonly appearance: OdontogramAppearance;
  readonly severity?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ToothWholeVisualLayer {
  readonly id: string;
  readonly kind: ToothWholeLayerKind;
  readonly appearance?: OdontogramAppearance;
}

export interface UnsupportedToothSurfaceVisual {
  readonly surface: ToothSurface;
  readonly reason: 'unsupported-template-surface';
}

export interface UnsupportedToothConditionVisual {
  readonly condition: 'root-canal';
  readonly reason: 'unsupported-template-view';
}

export type UnsupportedToothVisual =
  | UnsupportedToothSurfaceVisual
  | UnsupportedToothConditionVisual;

export interface ToothSurfaceVisualLayerResult {
  readonly layers: readonly ToothSurfaceVisualLayer[];
  readonly unsupportedSurfaces: readonly UnsupportedToothSurfaceVisual[];
}

export interface ToothVisualLayerResult {
  readonly layers: readonly ToothVisualLayer[];
  readonly unsupportedVisuals: readonly UnsupportedToothVisual[];
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

export const TOOTH_WHOLE_LAYER_RESET_IDS = Object.freeze([
  'base',
  'tooth-base',
  'tooth-base-beauty',
  'tooth-healthy-pulp',
  'tooth-inflam-pulp',
  'implant',
  'implant-base',
  'extraction-plan',
  'endo-filling',
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

export function deriveToothVisualLayers(
  tooth: OdontogramTooth,
  view: ToothSvgTemplateView,
): ToothVisualLayerResult {
  const wholeToothResult = deriveWholeToothVisualLayers(tooth, view);
  const surfaceResult = deriveToothSurfaceVisualLayers(tooth, view);

  return {
    layers: [...wholeToothResult.layers, ...surfaceResult.layers],
    unsupportedVisuals: [
      ...wholeToothResult.unsupportedVisuals,
      ...surfaceResult.unsupportedSurfaces,
    ],
  };
}

export function deriveWholeToothVisualLayers(
  tooth: OdontogramTooth,
  view: ToothSvgTemplateView,
): ToothVisualLayerResult {
  const layers: ToothWholeVisualLayer[] = [
    { id: 'base', kind: 'base' },
    ...getToothBaseLayerIds(tooth.base).map((id) => ({
      id,
      kind: 'base' as const,
    })),
  ];
  const unsupportedVisuals: UnsupportedToothVisual[] = [];

  for (const condition of tooth.conditions) {
    if (condition.kind === 'extraction') {
      layers.push({
        appearance: condition.appearance,
        id: 'extraction-plan',
        kind: 'extraction',
      });
      continue;
    }

    if (condition.kind === 'endodontic') {
      if (view === 'side') {
        layers.push({
          appearance: condition.appearance,
          id: 'endo-filling',
          kind: 'endodontic',
        });
      } else {
        unsupportedVisuals.push({
          condition: 'root-canal',
          reason: 'unsupported-template-view',
        });
      }
    }
  }

  return { layers, unsupportedVisuals };
}

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

function getToothBaseLayerIds(base: ToothBase): readonly string[] {
  if (base === 'natural') {
    return ['tooth-base', 'tooth-base-beauty', 'tooth-healthy-pulp'];
  }

  if (base === 'implant') {
    return ['implant', 'implant-base'];
  }

  return [];
}
