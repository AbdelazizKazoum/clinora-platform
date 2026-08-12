// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: permanent ToothPosition formatting only; primary-tooth remapping is deferred.

import type { ToothNumberingSystem, ToothPosition } from '../model/odontogram';

/**
 * Formats Clinora's stable permanent FDI position into a display label.
 *
 * Primary dentition uses the same internal permanent positions in the visual
 * chart, so primary display remapping remains outside ODONTO-02.
 */
export function formatToothNumber(
  position: ToothPosition,
  system: ToothNumberingSystem,
): string {
  if (system === 'fdi') {
    return String(position);
  }

  const quadrant = Math.floor(position / 10);
  const quadrantPosition = position % 10;

  if (system === 'universal') {
    return formatUniversalAdultTooth(quadrant, quadrantPosition);
  }

  return formatPalmerAdultTooth(quadrant, quadrantPosition);
}

function formatUniversalAdultTooth(
  quadrant: number,
  quadrantPosition: number,
): string {
  if (quadrant === 1) {
    return String(9 - quadrantPosition);
  }

  if (quadrant === 2) {
    return String(8 + quadrantPosition);
  }

  if (quadrant === 3) {
    return String(25 - quadrantPosition);
  }

  return String(24 + quadrantPosition);
}

function formatPalmerAdultTooth(
  quadrant: number,
  quadrantPosition: number,
): string {
  const quadrantLabel = getPalmerQuadrantLabel(quadrant);

  return `${quadrantLabel}-${quadrantPosition}`;
}

function getPalmerQuadrantLabel(quadrant: number): 'UR' | 'UL' | 'LL' | 'LR' {
  if (quadrant === 1) {
    return 'UR';
  }

  if (quadrant === 2) {
    return 'UL';
  }

  if (quadrant === 3) {
    return 'LL';
  }

  return 'LR';
}
