// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: permanent-tooth layout metadata only; no renderer state or DOM code.

import { TOOTH_POSITIONS, type ToothPosition } from '../model/odontogram';

export type ToothArch = 'upper' | 'lower';
export type ToothQuadrant = 1 | 2 | 3 | 4;
export type ToothClass = 'anterior' | 'posterior';
export type ToothSideTemplate = 11 | 13 | 14 | 16;
export type ToothOcclusalTemplate = 14 | 16;
export type ToothRotation = 0 | 180;

export interface ToothLayout {
  readonly position: ToothPosition;
  readonly arch: ToothArch;
  readonly quadrant: ToothQuadrant;
  readonly quadrantPosition: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly globalIndex: number;
  readonly archIndex: number;
  readonly toothClass: ToothClass;
  readonly sideTemplate: ToothSideTemplate;
  readonly occlusalTemplate: ToothOcclusalTemplate | null;
  readonly hasOcclusalView: boolean;
  readonly rotation: ToothRotation;
  readonly mirror: boolean;
}

export const UPPER_ARCH_POSITIONS: readonly ToothPosition[] = Object.freeze([
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
] as const);

export const LOWER_ARCH_POSITIONS: readonly ToothPosition[] = Object.freeze([
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const);

const POSTERIOR_OCCLUSAL_TEMPLATE_BY_SIDE_TEMPLATE: Readonly<
  Record<14 | 16, ToothOcclusalTemplate>
> = Object.freeze({
  14: 14,
  16: 16,
});

export const TOOTH_LAYOUTS = Object.freeze(
  TOOTH_POSITIONS.map((position, globalIndex) =>
    Object.freeze(createToothLayout(position, globalIndex)),
  ),
);

export const TOOTH_LAYOUT_BY_POSITION = Object.freeze(
  Object.fromEntries(
    TOOTH_LAYOUTS.map((layout) => [layout.position, layout]),
  ) as Record<ToothPosition, ToothLayout>,
);

export function getToothLayout(position: ToothPosition): ToothLayout {
  const layout = TOOTH_LAYOUT_BY_POSITION[position];
  if (layout === undefined) {
    throw new Error(`Unknown tooth position: ${String(position)}`);
  }

  return layout;
}

export function isAnteriorToothPosition(position: ToothPosition): boolean {
  return getToothLayout(position).toothClass === 'anterior';
}

export function hasOcclusalToothView(position: ToothPosition): boolean {
  return getToothLayout(position).hasOcclusalView;
}

function createToothLayout(
  position: ToothPosition,
  globalIndex: number,
): ToothLayout {
  const quadrant = getQuadrant(position);
  const quadrantPosition = getQuadrantPosition(position);
  const arch = quadrant === 1 || quadrant === 2 ? 'upper' : 'lower';
  const sideTemplate = getSideTemplate(quadrantPosition);
  const toothClass = quadrantPosition <= 3 ? 'anterior' : 'posterior';
  const occlusalTemplate =
    sideTemplate === 14 || sideTemplate === 16
      ? POSTERIOR_OCCLUSAL_TEMPLATE_BY_SIDE_TEMPLATE[sideTemplate]
      : null;

  return {
    position,
    arch,
    quadrant,
    quadrantPosition,
    globalIndex,
    archIndex:
      arch === 'upper'
        ? UPPER_ARCH_POSITIONS.indexOf(position)
        : LOWER_ARCH_POSITIONS.indexOf(position),
    toothClass,
    sideTemplate,
    occlusalTemplate,
    hasOcclusalView: occlusalTemplate !== null,
    rotation: arch === 'lower' ? 180 : 0,
    mirror: quadrant === 2 || quadrant === 4,
  };
}

function getQuadrant(position: ToothPosition): ToothQuadrant {
  return Math.floor(position / 10) as ToothQuadrant;
}

function getQuadrantPosition(
  position: ToothPosition,
): ToothLayout['quadrantPosition'] {
  return (position % 10) as ToothLayout['quadrantPosition'];
}

function getSideTemplate(
  quadrantPosition: ToothLayout['quadrantPosition'],
): ToothSideTemplate {
  if (quadrantPosition <= 2) {
    return 11;
  }

  if (quadrantPosition === 3) {
    return 13;
  }

  if (quadrantPosition <= 5) {
    return 14;
  }

  return 16;
}
