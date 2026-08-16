import type {
  FillingMaterial,
  OdontogramAppearance,
  OdontogramCondition,
  OdontogramTooth,
  ImplantProsthesisType,
  RestorationType,
  ToothBase,
  ToothPosition,
  ToothSurface,
} from '../model/odontogram';
import {
  composeBridgeUnitLayers,
  composeRestorationLayers,
  type RestorationLayerResult,
} from './restoration-layers';
import type { ToothSvgTemplateView } from './svg-template-loader';
import { hasOcclusalToothView } from './tooth-layout';

export type ToothSurfaceLayerKind = 'caries' | 'subcaries' | 'filling';
export type ToothWholeLayerKind =
  | 'base'
  | 'endodontic'
  | 'extraction'
  | 'restoration'
  | 'structure'
  | 'prosthesis';
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
  readonly condition: 'root-canal' | RestorationType;
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
  'milktooth',
  'milktooth-base',
  'milktooth-beauty',
  'milktooth-healthy-pulp',
  'milktooth-inflam-pulp',
  'tooth-under-gum',
  'tooth-radix',
  'tooth-crownprep',
  'tooth-broken-incisal',
  'tooth-broken-distal-incisal',
  'tooth-broken-distal',
  'tooth-broken-mesial-distal-incisal',
  'tooth-broken-mesial-distal',
  'tooth-broken-mesial-incisal',
  'tooth-broken-mesial',
  'no-tooth-after-extraction',
  'missing-closed',
  'crown-needed',
  'crown-replace',
  'implant-healing-abutment',
  'implant-locator-screw',
  'implant-bar',
  'prosthesis',
  'prosthesis-crown',
  'prosthesis-connector',
  'prosthesis-implant',
  'prosthesis-implant-crown',
  'prosthesis-implant-gum',
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
    ...getToothBaseLayerIds(tooth).map((id) => ({
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

    if (condition.kind === 'structure') {
      for (const id of structureLayerIds(condition)) {
        layers.push({
          appearance: condition.appearance,
          id,
          kind: 'structure',
        });
      }
      continue;
    }

    if (condition.kind === 'planned-implant') {
      layers.push(
        { appearance: condition.appearance, id: 'implant', kind: 'base' },
        { appearance: condition.appearance, id: 'implant-base', kind: 'base' },
      );
      continue;
    }

    if (condition.kind === 'prosthesis') {
      for (const id of prosthesisLayerIds(condition.prosthesis, tooth.base)) {
        layers.push({
          appearance: condition.appearance,
          id,
          kind: 'prosthesis',
        });
      }
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
      continue;
    }

    if (condition.kind === 'restoration') {
      const restorationResult = composeRestorationLayers({
        material: condition.material,
        restoration: condition.restoration,
        view,
      });

      layers.push(
        ...restorationResult.layerIds.map((id) => ({
          appearance: condition.appearance,
          id,
          kind: 'restoration' as const,
        })),
      );

      if (tooth.base === 'implant' && condition.restoration === 'crown') {
        layers.push({
          appearance: condition.appearance,
          id: 'implant-connector',
          kind: 'restoration',
        });
      }

      addUnsupportedRestorationVisual(
        unsupportedVisuals,
        condition.restoration,
        restorationResult,
      );
      continue;
    }

    if (condition.kind === 'bridge') {
      layers.push(
        ...composeBridgeUnitLayers(condition.material).map((id) => ({
          appearance: condition.appearance,
          id,
          kind: 'restoration' as const,
        })),
      );

      if (tooth.base === 'implant' && condition.role === 'abutment') {
        layers.push({
          appearance: condition.appearance,
          id: 'implant-connector',
          kind: 'restoration',
        });
      }
    }
  }

  return { layers, unsupportedVisuals };
}

function addUnsupportedRestorationVisual(
  unsupportedVisuals: UnsupportedToothVisual[],
  restoration: RestorationType,
  result: RestorationLayerResult,
): void {
  if (result.unsupportedReason === 'unsupported-view') {
    unsupportedVisuals.push({
      condition: restoration,
      reason: 'unsupported-template-view',
    });
  }
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

function getToothBaseLayerIds(tooth: OdontogramTooth): readonly string[] {
  const hidesNaturalBase = tooth.conditions.some(
    (condition) =>
      condition.kind === 'structure' &&
      ['under-gum', 'radix', 'broken', 'crown-preparation'].includes(
        condition.state,
      ),
  );

  if (hidesNaturalBase && tooth.base === 'natural') {
    return [];
  }

  if (tooth.base === 'natural' && tooth.dentition === 'primary') {
    return [
      'milktooth',
      'milktooth-base',
      'milktooth-beauty',
      'milktooth-healthy-pulp',
    ];
  }

  if (tooth.base === 'natural') {
    return ['tooth-base', 'tooth-base-beauty', 'tooth-healthy-pulp'];
  }

  if (tooth.base === 'implant') {
    return ['implant', 'implant-base'];
  }

  return [];
}

function structureLayerIds(
  condition: Extract<OdontogramCondition, { readonly kind: 'structure' }>,
): readonly string[] {
  switch (condition.state) {
    case 'under-gum':
      return ['tooth-under-gum'];
    case 'radix':
      return ['tooth-radix'];
    case 'crown-preparation':
      return ['tooth-crownprep'];
    case 'missing-after-extraction':
    case 'extraction-wound':
      return ['no-tooth-after-extraction'];
    case 'missing-closed':
      return ['missing-closed'];
    case 'crown-needed':
      return ['crown-needed'];
    case 'crown-replacement':
      return ['crown-replace'];
    case 'broken':
      return [brokenLayerId(condition.fractureRegions ?? ['incisal'])];
  }
}

function brokenLayerId(
  regions: readonly ('mesial' | 'incisal' | 'distal')[],
): string {
  const hasMesial = regions.includes('mesial');
  const hasIncisal = regions.includes('incisal');
  const hasDistal = regions.includes('distal');
  if (hasMesial && hasIncisal && hasDistal) return 'tooth-broken-mesial-distal-incisal';
  if (hasMesial && hasIncisal) return 'tooth-broken-mesial-incisal';
  if (hasMesial && hasDistal) return 'tooth-broken-mesial-distal';
  if (hasIncisal && hasDistal) return 'tooth-broken-distal-incisal';
  if (hasMesial) return 'tooth-broken-mesial';
  if (hasDistal) return 'tooth-broken-distal';
  return 'tooth-broken-incisal';
}

function prosthesisLayerIds(
  prosthesis: ImplantProsthesisType,
  base: ToothBase,
): readonly string[] {
  if (base === 'missing' && (prosthesis === 'removable-partial' || prosthesis === 'removable-full')) {
    return ['prosthesis', 'prosthesis-crown', 'prosthesis-connector'];
  }
  if (base !== 'implant') return [];
  if (prosthesis === 'healing-abutment') return ['implant-healing-abutment'];

  const attachment = ['implant-connector', 'implant-locator-screw'];
  if (prosthesis === 'locator') return attachment;
  if (prosthesis === 'bar') return [...attachment, 'implant-bar'];
  if (prosthesis === 'locator-overdenture') {
    return [...attachment, 'prosthesis-implant', 'prosthesis-implant-crown', 'prosthesis-implant-gum'];
  }
  if (prosthesis === 'bar-overdenture') {
    return [...attachment, 'implant-bar', 'prosthesis-implant', 'prosthesis-implant-crown', 'prosthesis-implant-gum'];
  }
  return [];
}
