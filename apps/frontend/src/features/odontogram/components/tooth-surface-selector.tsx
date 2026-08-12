'use client';

import type { ToothPosition, ToothSurface } from '../model/odontogram';
import { getToothSurfaceNotation } from '../utils/surface-notation';
import styles from './odontogram.module.scss';

export interface ToothSurfaceSelectorProps {
  readonly toothPosition: ToothPosition;
  readonly value: readonly ToothSurface[];
  readonly onChange?: (next: readonly ToothSurface[]) => void;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const SURFACE_LAYOUT: readonly {
  readonly surface: ToothSurface;
  readonly className: string;
}[] = [
  { className: styles.surfaceBuccal, surface: 'buccal' },
  { className: styles.surfaceMesial, surface: 'mesial' },
  { className: styles.surfaceOcclusal, surface: 'occlusal' },
  { className: styles.surfaceDistal, surface: 'distal' },
  { className: styles.surfaceLingual, surface: 'lingual' },
];

const CANONICAL_SURFACE_ORDER: readonly ToothSurface[] = [
  'mesial',
  'distal',
  'buccal',
  'lingual',
  'occlusal',
];

export function ToothSurfaceSelector({
  toothPosition,
  value,
  onChange,
  disabled = false,
  ariaLabel = `Tooth ${toothPosition} surfaces`,
  className,
}: ToothSurfaceSelectorProps) {
  const selectedSurfaces = new Set(value);

  const toggleSurface = (surface: ToothSurface) => {
    if (disabled) {
      return;
    }

    const nextSurfaces = new Set(value);
    if (nextSurfaces.has(surface)) {
      nextSurfaces.delete(surface);
    } else {
      nextSurfaces.add(surface);
    }

    onChange?.(sortSurfaces([...nextSurfaces]));
  };

  return (
    <div
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={ariaLabel}
      className={[styles.surfaceSelector, className].filter(Boolean).join(' ')}
      data-odontogram-surface-selector=""
      data-odontogram-tooth-position={toothPosition}
      role="group"
    >
      {SURFACE_LAYOUT.map(({ surface, className: surfaceClassName }) => {
        const notation = getToothSurfaceNotation(toothPosition, surface);
        const selected = selectedSurfaces.has(surface);

        return (
          <button
            aria-label={notation.ariaLabel}
            aria-pressed={selected}
            className={`${styles.surfaceButton} ${surfaceClassName}`}
            data-odontogram-surface={surface}
            disabled={disabled}
            key={surface}
            onClick={() => toggleSurface(surface)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') {
                return;
              }

              event.preventDefault();
              toggleSurface(surface);
            }}
            title={notation.label}
            type="button"
          >
            <span aria-hidden="true">{notation.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function sortSurfaces(
  surfaces: readonly ToothSurface[],
): readonly ToothSurface[] {
  const selectedSurfaces = new Set(surfaces);

  return CANONICAL_SURFACE_ORDER.filter((surface) =>
    selectedSurfaces.has(surface),
  );
}
