// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: stable permanent-position formatting with
// primary-dentition display remapping.

import type {
  ToothDentition,
  ToothNumberingSystem,
  ToothPosition,
} from '../model/odontogram';

/**
 * Formats Clinora's stable permanent FDI position into a display label.
 *
 * Primary dentition uses the same internal permanent positions in the visual
 * chart, while the displayed label follows the selected numbering system.
 */
export function formatToothNumber(
  position: ToothPosition,
  system: ToothNumberingSystem,
  dentition: ToothDentition = 'permanent',
): string {
  if (dentition === 'primary') {
    return formatPrimaryToothNumber(position, system);
  }

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

function formatPrimaryToothNumber(
  position: ToothPosition,
  system: ToothNumberingSystem,
): string {
  const quadrant = Math.floor(position / 10);
  const quadrantPosition = position % 10;
  const primaryQuadrant = quadrant + 4;

  if (system === 'fdi') {
    return `${primaryQuadrant}${quadrantPosition}`;
  }

  if (system === 'universal') {
    const index =
      quadrant === 1
        ? quadrantPosition - 1
        : quadrant === 2
          ? 5 + quadrantPosition - 1
          : quadrant === 3
            ? 10 + quadrantPosition - 1
            : 15 + quadrantPosition - 1;
    return String.fromCharCode('A'.charCodeAt(0) + index);
  }

  return `${getPrimaryPalmerQuadrantLabel(quadrant)}-${quadrantPosition}`;
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

function getPrimaryPalmerQuadrantLabel(
  quadrant: number,
): 'UR' | 'UL' | 'LL' | 'LR' {
  return getPalmerQuadrantLabel(quadrant);
}
