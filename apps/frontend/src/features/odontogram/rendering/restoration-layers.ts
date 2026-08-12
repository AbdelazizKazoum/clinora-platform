// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: fixed-restoration layer composition only; no UI options or clinical workflow.

import type { RestorationMaterial, RestorationType } from '../model/odontogram';
import type { ToothSvgTemplateView } from './svg-template-loader';

export interface RestorationLayerInput {
  readonly restoration: RestorationType;
  readonly material: RestorationMaterial;
  readonly view: ToothSvgTemplateView;
}

export interface RestorationLayerResult {
  readonly layerIds: readonly string[];
  readonly unsupportedReason?: 'unsupported-view';
}

const FULL_RESTORATION_MATERIALS: readonly RestorationMaterial[] = [
  'emax',
  'gold',
  'gradia',
  'zircon',
  'metal',
  'metal-ceramic',
  'telescope',
  'temporary',
];

const PARTIAL_RESTORATION_MATERIALS: readonly RestorationMaterial[] = [
  'emax',
  'gold',
  'gradia',
  'zircon',
  'temporary',
];

export const RESTORATION_LAYER_MATRIX = Object.freeze({
  crown: Object.freeze({
    materials: FULL_RESTORATION_MATERIALS,
    occlusalOnly: false,
  }),
  inlay: Object.freeze({
    materials: PARTIAL_RESTORATION_MATERIALS,
    occlusalOnly: false,
  }),
  onlay: Object.freeze({
    materials: PARTIAL_RESTORATION_MATERIALS,
    occlusalOnly: true,
  }),
  veneer: Object.freeze({
    materials: PARTIAL_RESTORATION_MATERIALS,
    occlusalOnly: false,
  }),
} satisfies Record<
  RestorationType,
  {
    readonly materials: readonly RestorationMaterial[];
    readonly occlusalOnly: boolean;
  }
>);

export const RESTORATION_LAYER_RESET_IDS = Object.freeze(
  collectRestorationLayerIds(),
);

export function composeRestorationLayers({
  restoration,
  material,
  view,
}: RestorationLayerInput): RestorationLayerResult {
  const matrixEntry = RESTORATION_LAYER_MATRIX[restoration];

  if (matrixEntry.occlusalOnly && view !== 'occlusal') {
    return {
      layerIds: [],
      unsupportedReason: 'unsupported-view',
    };
  }

  if (!matrixEntry.materials.includes(material)) {
    return { layerIds: [] };
  }

  if (restoration === 'crown') {
    return {
      layerIds: crownLayerIds(material),
    };
  }

  return {
    layerIds: [`${material}-${restoration}`],
  };
}

export function composeBridgeUnitLayers(
  material: RestorationMaterial,
): readonly string[] {
  return [...crownLayerIds(material), `${material}-bridge-connector`];
}

function crownLayerIds(material: RestorationMaterial): readonly string[] {
  return material === 'telescope'
    ? ['telescope-crown', 'telescope-crown-inside', 'telescope-crown-outside']
    : [`${material}-crown`];
}

function collectRestorationLayerIds(): readonly string[] {
  const layerIds = new Set<string>(['implant-connector']);

  for (const material of FULL_RESTORATION_MATERIALS) {
    for (const layerId of composeBridgeUnitLayers(material)) {
      layerIds.add(layerId);
    }
  }

  for (const restoration of Object.keys(
    RESTORATION_LAYER_MATRIX,
  ) as RestorationType[]) {
    for (const material of RESTORATION_LAYER_MATRIX[restoration].materials) {
      for (const view of ['side', 'occlusal'] as const) {
        for (const layerId of composeRestorationLayers({
          material,
          restoration,
          view,
        }).layerIds) {
          layerIds.add(layerId);
        }
      }
    }
  }

  return [...layerIds].sort();
}
