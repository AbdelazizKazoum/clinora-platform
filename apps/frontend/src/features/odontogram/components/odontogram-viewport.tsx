'use client';

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import styles from './odontogram.module.scss';

export interface OdontogramViewportRenderProps {
  readonly zoom: number;
}

export interface OdontogramViewportProps {
  readonly ariaLabel: string;
  readonly children: (props: OdontogramViewportRenderProps) => ReactNode;
}

export const ODONTOGRAM_MIN_ZOOM = 0.75;
export const ODONTOGRAM_DEFAULT_ZOOM = 1;
export const ODONTOGRAM_MAX_ZOOM = 1.5;
export const ODONTOGRAM_ZOOM_STEP = 0.25;

export function OdontogramViewport({
  ariaLabel,
  children,
}: OdontogramViewportProps) {
  const [zoom, setZoom] = useState(ODONTOGRAM_DEFAULT_ZOOM);
  const zoomPercent = Math.round(zoom * 100);
  const canZoomOut = zoom > ODONTOGRAM_MIN_ZOOM;
  const canZoomIn = zoom < ODONTOGRAM_MAX_ZOOM;
  const zoomStyle = useMemo(
    () =>
      ({
        '--odontogram-zoom': String(zoom),
      }) as CSSProperties,
    [zoom],
  );
  const zoomOut = useCallback(() => {
    setZoom((currentZoom) => normalizeZoom(currentZoom - ODONTOGRAM_ZOOM_STEP));
  }, []);
  const zoomIn = useCallback(() => {
    setZoom((currentZoom) => normalizeZoom(currentZoom + ODONTOGRAM_ZOOM_STEP));
  }, []);
  const resetZoom = useCallback(() => {
    setZoom(ODONTOGRAM_DEFAULT_ZOOM);
  }, []);

  return (
    <div className={styles.viewportShell} data-odontogram-viewport-shell="">
      <div
        aria-label={`${ariaLabel} zoom controls`}
        className={styles.viewportToolbar}
      >
        <button
          aria-label="Zoom out odontogram"
          className="btn btn-sm btn-light"
          disabled={!canZoomOut}
          onClick={zoomOut}
          type="button"
        >
          −
        </button>
        <span
          aria-live="polite"
          className={styles.zoomStatus}
          data-odontogram-zoom-status=""
        >
          {zoomPercent}%
        </span>
        <button
          aria-label="Zoom in odontogram"
          className="btn btn-sm btn-light"
          disabled={!canZoomIn}
          onClick={zoomIn}
          type="button"
        >
          +
        </button>
        <button
          aria-label="Reset odontogram zoom"
          className="btn btn-sm btn-link"
          disabled={zoom === ODONTOGRAM_DEFAULT_ZOOM}
          onClick={resetZoom}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className={styles.chartViewport} data-odontogram-viewport="">
        <div className={styles.chartScaleSizer} style={zoomStyle}>
          <div
            className={styles.chartScaleLayer}
            data-odontogram-zoom={zoomPercent}
          >
            {children({ zoom })}
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeZoom(value: number): number {
  const clamped = Math.min(
    ODONTOGRAM_MAX_ZOOM,
    Math.max(ODONTOGRAM_MIN_ZOOM, value),
  );

  return Math.round(clamped * 100) / 100;
}
