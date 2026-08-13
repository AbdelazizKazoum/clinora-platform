// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: pure bridge span and overlay geometry only; no global DOM renderer.

import type {
  OdontogramAppearance,
  OdontogramData,
  RestorationMaterial,
  ToothPosition,
} from '../model/odontogram';
import {
  LOWER_ARCH_POSITIONS,
  UPPER_ARCH_POSITIONS,
  type ToothArch,
} from './tooth-layout';

export const SADDLE_Y_FRACTION = 0.72;
export const SADDLE_Y_FRACTION_LOWER = 1 - SADDLE_Y_FRACTION;
export const SADDLE_THICKNESS = 0.09;
export const SADDLE_OVERLAP = 0.12;

export interface BridgeUnit {
  readonly position: ToothPosition;
  readonly bridgeId: string;
  readonly role: 'abutment' | 'pontic';
  readonly material: RestorationMaterial;
  readonly appearance: OdontogramAppearance;
}

export interface BridgeSpan {
  readonly bridgeId: string;
  readonly arch: ToothArch;
  readonly positions: readonly ToothPosition[];
  readonly material: RestorationMaterial;
  readonly appearance: OdontogramAppearance;
}

export interface BridgeLayoutIssue {
  readonly bridgeId: string;
  readonly reason:
    | 'too-few-units'
    | 'cross-arch'
    | 'non-contiguous'
    | 'mixed-material'
    | 'mixed-appearance';
  readonly positions: readonly ToothPosition[];
}

export interface BridgeSpanDerivation {
  readonly spans: readonly BridgeSpan[];
  readonly issues: readonly BridgeLayoutIssue[];
}

export interface GridRelativeRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type BridgeRectResolver = (
  position: ToothPosition,
) => GridRelativeRect | null;

export type BridgeMaterialColorResolver = (
  material: RestorationMaterial,
) => string;

export interface BridgeBar {
  readonly bridgeId: string;
  readonly arch: ToothArch;
  readonly from: ToothPosition;
  readonly to: ToothPosition;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly appearance: OdontogramAppearance;
}

const BRIDGE_MATERIAL_COLORS: Readonly<Record<RestorationMaterial, string>> =
  Object.freeze({
    emax: '#e9e1d2',
    gold: '#ece614',
    gradia: '#55ff98',
    zircon: '#feffbf',
    metal: '#0051bf',
    'metal-ceramic': '#c9ccd1',
    telescope: '#0051bf',
    temporary: '#ffffff',
  });

const ARCH_POSITIONS = Object.freeze({
  lower: LOWER_ARCH_POSITIONS,
  upper: UPPER_ARCH_POSITIONS,
} satisfies Record<ToothArch, readonly ToothPosition[]>);

const ARCH_BY_POSITION: ReadonlyMap<ToothPosition, ToothArch> = new Map([
  ...UPPER_ARCH_POSITIONS.map((position) => [position, 'upper'] as const),
  ...LOWER_ARCH_POSITIONS.map((position) => [position, 'lower'] as const),
]);

const ARCH_INDEX_BY_POSITION: ReadonlyMap<ToothPosition, number> = new Map(
  [...UPPER_ARCH_POSITIONS, ...LOWER_ARCH_POSITIONS].map((position) => {
    const arch = ARCH_BY_POSITION.get(position);
    if (arch === undefined) {
      throw new Error(`Unknown tooth position: ${String(position)}`);
    }

    return [position, ARCH_POSITIONS[arch].indexOf(position)] as const;
  }),
);

export function defaultBridgeMaterialColor(
  material: RestorationMaterial,
): string {
  return BRIDGE_MATERIAL_COLORS[material] ?? '#8a8f98';
}

export function deriveBridgeSpans(data: OdontogramData): BridgeSpanDerivation {
  const unitsByBridgeId = collectBridgeUnits(data);
  const spans: BridgeSpan[] = [];
  const issues: BridgeLayoutIssue[] = [];

  for (const [bridgeId, units] of sortBridgeGroups(unitsByBridgeId)) {
    const sortedUnits = sortBridgeUnits(units);
    const positions = sortedUnits.map((unit) => unit.position);
    const groupIssues = validateBridgeGroup(bridgeId, sortedUnits, positions);

    if (groupIssues.length > 0) {
      issues.push(...groupIssues);
      continue;
    }

    const firstUnit = sortedUnits[0];
    const arch =
      firstUnit === undefined ? undefined : getArch(firstUnit.position);
    if (firstUnit === undefined || arch === undefined) {
      continue;
    }

    spans.push({
      appearance: firstUnit.appearance,
      arch,
      bridgeId,
      material: firstUnit.material,
      positions,
    });
  }

  return { issues, spans };
}

export function computeBridgeBars(
  spans: readonly BridgeSpan[],
  rectFor: BridgeRectResolver,
  materialColor: BridgeMaterialColorResolver = defaultBridgeMaterialColor,
): readonly BridgeBar[] {
  const bars: BridgeBar[] = [];

  for (const span of spans) {
    for (let index = 0; index < span.positions.length - 1; index += 1) {
      const from = span.positions[index];
      const to = span.positions[index + 1];
      if (from === undefined || to === undefined) {
        continue;
      }

      const fromRect = rectFor(from);
      const toRect = rectFor(to);
      const bar = computeBridgeBar(span, from, fromRect, to, toRect);
      if (bar === null) {
        continue;
      }

      bars.push({
        ...bar,
        fill: materialColor(span.material),
      });
    }
  }

  return bars;
}

function collectBridgeUnits(
  data: OdontogramData,
): ReadonlyMap<string, readonly BridgeUnit[]> {
  const unitsByBridgeId = new Map<string, BridgeUnit[]>();

  for (const tooth of data.teeth) {
    for (const condition of tooth.conditions) {
      if (condition.kind !== 'bridge') {
        continue;
      }

      const units = unitsByBridgeId.get(condition.bridgeId) ?? [];
      units.push({
        appearance: condition.appearance,
        bridgeId: condition.bridgeId,
        material: condition.material,
        position: tooth.position,
        role: condition.role,
      });
      unitsByBridgeId.set(condition.bridgeId, units);
    }
  }

  return unitsByBridgeId;
}

function sortBridgeGroups(
  unitsByBridgeId: ReadonlyMap<string, readonly BridgeUnit[]>,
): readonly [string, readonly BridgeUnit[]][] {
  return Array.from(unitsByBridgeId.entries()).sort(
    ([leftBridgeId, leftUnits], [rightBridgeId, rightUnits]) => {
      const leftIndex = getFirstCanonicalIndex(leftUnits);
      const rightIndex = getFirstCanonicalIndex(rightUnits);

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return leftBridgeId.localeCompare(rightBridgeId);
    },
  );
}

function sortBridgeUnits(units: readonly BridgeUnit[]): readonly BridgeUnit[] {
  return [...units].sort(
    (left, right) =>
      getCanonicalIndex(left.position) - getCanonicalIndex(right.position),
  );
}

function validateBridgeGroup(
  bridgeId: string,
  units: readonly BridgeUnit[],
  positions: readonly ToothPosition[],
): readonly BridgeLayoutIssue[] {
  const issues: BridgeLayoutIssue[] = [];
  const arches = new Set(units.map((unit) => getArch(unit.position)));
  const materials = new Set(units.map((unit) => unit.material));
  const appearances = new Set(units.map((unit) => unit.appearance));

  if (units.length < 2) {
    issues.push({ bridgeId, positions, reason: 'too-few-units' });
  }

  if (arches.size > 1) {
    issues.push({ bridgeId, positions, reason: 'cross-arch' });
  }

  if (materials.size > 1) {
    issues.push({ bridgeId, positions, reason: 'mixed-material' });
  }

  if (appearances.size > 1) {
    issues.push({ bridgeId, positions, reason: 'mixed-appearance' });
  }

  if (arches.size === 1 && !hasContiguousPositions(units)) {
    issues.push({ bridgeId, positions, reason: 'non-contiguous' });
  }

  return issues;
}

function hasContiguousPositions(units: readonly BridgeUnit[]): boolean {
  const firstUnit = units[0];
  const arch =
    firstUnit === undefined ? undefined : getArch(firstUnit.position);
  if (arch === undefined) {
    return false;
  }

  const sortedArchIndexes = units
    .map((unit) => ARCH_INDEX_BY_POSITION.get(unit.position))
    .filter((index): index is number => index !== undefined)
    .sort((left, right) => left - right);
  const firstIndex = sortedArchIndexes[0];
  const lastIndex = sortedArchIndexes[sortedArchIndexes.length - 1];

  if (firstIndex === undefined || lastIndex === undefined) {
    return false;
  }

  return lastIndex - firstIndex + 1 === sortedArchIndexes.length;
}

function computeBridgeBar(
  span: BridgeSpan,
  from: ToothPosition,
  fromRect: GridRelativeRect | null,
  to: ToothPosition,
  toRect: GridRelativeRect | null,
): Omit<BridgeBar, 'fill'> | null {
  if (
    fromRect === null ||
    toRect === null ||
    fromRect.width <= 0 ||
    fromRect.height <= 0 ||
    toRect.width <= 0 ||
    toRect.height <= 0
  ) {
    return null;
  }

  const leftRect = fromRect.x <= toRect.x ? fromRect : toRect;
  const rightRect = fromRect.x <= toRect.x ? toRect : fromRect;
  const overlap = Math.min(leftRect.width, rightRect.width) * SADDLE_OVERLAP;
  const x = leftRect.x + leftRect.width - overlap;
  const width = rightRect.x + overlap - x;
  if (width <= 0) {
    return null;
  }

  const sourceRect = fromRect;
  const height = sourceRect.height * SADDLE_THICKNESS;
  const yFraction =
    span.arch === 'lower' ? SADDLE_Y_FRACTION_LOWER : SADDLE_Y_FRACTION;

  return {
    appearance: span.appearance,
    arch: span.arch,
    bridgeId: span.bridgeId,
    from,
    height,
    to,
    width,
    x,
    y: sourceRect.y + sourceRect.height * yFraction - height / 2,
  };
}

function getFirstCanonicalIndex(units: readonly BridgeUnit[]): number {
  return units.reduce(
    (lowestIndex, unit) =>
      Math.min(lowestIndex, getCanonicalIndex(unit.position)),
    Number.POSITIVE_INFINITY,
  );
}

function getCanonicalIndex(position: ToothPosition): number {
  return ARCH_INDEX_BY_POSITION.get(position) ?? Number.POSITIVE_INFINITY;
}

function getArch(position: ToothPosition): ToothArch | undefined {
  return ARCH_BY_POSITION.get(position);
}
