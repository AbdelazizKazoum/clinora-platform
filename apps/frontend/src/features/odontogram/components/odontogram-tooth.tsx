'use client';

// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: one instance-safe React tooth renderer; no singleton chart state.

import { memo, useEffect, useId, useRef, useState } from 'react';

import type {
  OdontogramTooth as OdontogramToothModel,
  ToothPosition,
} from '../model/odontogram';
import {
  applyToothVisuals,
  type ApplyToothVisualsResult,
} from '../rendering/apply-tooth-visuals';
import { namespaceSvgIds } from '../rendering/svg-id-namespace';
import {
  loadToothSvgTemplate,
  type LoadToothSvgTemplateOptions,
  type ToothSvgTemplateId,
  type ToothSvgTemplateView,
} from '../rendering/svg-template-loader';
import { getToothLayout } from '../rendering/tooth-layout';
import styles from './odontogram.module.scss';

export interface OdontogramToothProps {
  readonly position: ToothPosition;
  readonly view?: ToothSvgTemplateView;
  readonly chartInstanceId?: string;
  readonly basePath?: string;
  readonly assetPrefix?: string;
  readonly fetcher?: LoadToothSvgTemplateOptions['fetcher'];
  readonly tooth?: OdontogramToothModel;
  readonly showUnsupportedVisualFallback?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly ariaHidden?: boolean;
  readonly suppressImageRole?: boolean;
}

type ToothRenderStatus = 'loading' | 'ready' | 'error' | 'unavailable';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const OdontogramTooth = memo(function OdontogramTooth({
  position,
  view = 'side',
  chartInstanceId,
  basePath,
  assetPrefix,
  fetcher,
  tooth,
  showUnsupportedVisualFallback = true,
  className,
  ariaLabel,
  ariaHidden = false,
  suppressImageRole = false,
}: OdontogramToothProps) {
  const reactId = useId();
  const svgHostRef = useRef<HTMLDivElement>(null);
  const semanticLayerIdByOriginalIdRef = useRef<ReadonlyMap<string, string>>(
    new Map(),
  );
  const [status, setStatus] = useState<ToothRenderStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unsupportedVisuals, setUnsupportedVisuals] = useState<
    ApplyToothVisualsResult['unsupportedVisuals']
  >([]);
  const templateId = resolveToothTemplateId(position, view);
  const layout = getToothLayout(position);
  const namespacePrefix = chartInstanceId ?? reactId;

  useEffect(() => {
    let disposed = false;
    const svgHost = svgHostRef.current;

    if (svgHost === null) {
      return undefined;
    }

    svgHost.replaceChildren();
    semanticLayerIdByOriginalIdRef.current = new Map();
    setErrorMessage(null);
    setUnsupportedVisuals([]);

    if (templateId === null) {
      setStatus('unavailable');
      return undefined;
    }

    setStatus('loading');

    void loadToothSvgTemplate(templateId, {
      assetPrefix,
      basePath,
      fetcher,
    })
      .then((template) => {
        if (disposed) {
          return;
        }

        const namespacedTemplate = namespaceSvgIds(template.svg, {
          namespacePrefix,
          toothPosition: position,
          view,
        });
        applyToothTransform(namespacedTemplate.svg, {
          mirror: layout.mirror,
          rotation: layout.rotation,
        });
        semanticLayerIdByOriginalIdRef.current =
          namespacedTemplate.layerIdByOriginalId;
        svgHost.replaceChildren(namespacedTemplate.svg);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }

        svgHost.replaceChildren();
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load tooth.',
        );
        setStatus('error');
      });

    return () => {
      disposed = true;
      svgHost.replaceChildren();
      semanticLayerIdByOriginalIdRef.current = new Map();
    };
  }, [
    assetPrefix,
    basePath,
    fetcher,
    layout.mirror,
    layout.rotation,
    namespacePrefix,
    position,
    templateId,
    view,
  ]);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }

    const svg = svgHostRef.current?.querySelector('svg');
    if (svg === undefined || svg === null || tooth === undefined) {
      setUnsupportedVisuals([]);
      return;
    }

    const result = applyToothVisuals({
      layerIdByOriginalId: semanticLayerIdByOriginalIdRef.current,
      svg: svg as unknown as SVGSVGElement,
      tooth,
      view,
    });

    setUnsupportedVisuals(result.unsupportedVisuals);
  }, [status, tooth, view]);

  return (
    <div
      aria-hidden={ariaHidden ? true : undefined}
      aria-label={
        ariaHidden || suppressImageRole
          ? undefined
          : (ariaLabel ?? `Tooth ${position} ${view} view`)
      }
      className={[styles.toothTile, className].filter(Boolean).join(' ')}
      data-odontogram-template={templateId ?? undefined}
      data-odontogram-tooth-position={position}
      data-odontogram-tooth-view={view}
      role={ariaHidden || suppressImageRole ? undefined : 'img'}
    >
      <div className={styles.toothSvgHost} ref={svgHostRef} />
      {status === 'loading' ? (
        <span className={styles.toothFallback} role="status">
          Loading tooth {position}
        </span>
      ) : null}
      {status === 'error' ? (
        <span
          className={`${styles.toothFallback} ${styles.toothError}`}
          role="alert"
        >
          {errorMessage ?? `Unable to load tooth ${position}`}
        </span>
      ) : null}
      {status === 'unavailable' ? (
        <span className={styles.toothFallback} role="status">
          No occlusal view
        </span>
      ) : null}
      {showUnsupportedVisualFallback
        ? unsupportedVisuals.map((unsupportedVisual) => (
            <span
              className={`${styles.toothFallback} ${styles.surfaceVisualFallback}`}
              data-odontogram-unsupported-visual={formatUnsupportedVisualKey(
                unsupportedVisual,
              )}
              key={formatUnsupportedVisualKey(unsupportedVisual)}
              role="status"
            >
              {formatUnsupportedVisualMessage(position, unsupportedVisual)}
            </span>
          ))
        : null}
    </div>
  );
});

export function resolveToothTemplateId(
  position: ToothPosition,
  view: ToothSvgTemplateView,
): ToothSvgTemplateId | null {
  const layout = getToothLayout(position);

  if (view === 'side') {
    return String(layout.sideTemplate) as ToothSvgTemplateId;
  }

  return layout.occlusalTemplate === null
    ? null
    : (`${layout.occlusalTemplate}_occl` as ToothSvgTemplateId);
}

function applyToothTransform(
  svg: SVGSVGElement,
  options: { readonly mirror: boolean; readonly rotation: 0 | 180 },
): void {
  if (options.rotation === 180) {
    wrapSvgChildren(svg, getRotateTransform(svg));
  }

  if (options.mirror) {
    wrapSvgChildren(svg, getMirrorTransform(svg));
  }
}

function wrapSvgChildren(svg: SVGSVGElement, transform: string): void {
  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  while (svg.firstChild !== null) {
    group.appendChild(svg.firstChild);
  }
  group.setAttribute('data-odontogram-transform', '');
  group.setAttribute('transform', transform);
  svg.appendChild(group);
}

function getRotateTransform(svg: SVGSVGElement): string {
  const viewBox = readViewBox(svg);
  const centerX = viewBox.minX + viewBox.width / 2;
  const centerY = viewBox.minY + viewBox.height / 2;

  return `rotate(180 ${centerX} ${centerY})`;
}

function getMirrorTransform(svg: SVGSVGElement): string {
  const viewBox = readViewBox(svg);
  const centerX = viewBox.minX + viewBox.width / 2;

  return `scale(-1 1) translate(${-2 * centerX} 0)`;
}

function readViewBox(svg: SVGSVGElement): {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
} {
  const [minX, minY, width, height] = (
    svg.getAttribute('viewBox') ?? '0 0 32 64'
  )
    .trim()
    .split(/\s+/u)
    .map(Number);

  if (
    minX === undefined ||
    minY === undefined ||
    width === undefined ||
    height === undefined ||
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return { minX: 0, minY: 0, width: 32, height: 64 };
  }

  return { minX, minY, width, height };
}

function formatUnsupportedVisualMessage(
  position: ToothPosition,
  unsupportedVisual: ApplyToothVisualsResult['unsupportedVisuals'][number],
): string {
  if ('surface' in unsupportedVisual) {
    return `Tooth ${position} ${unsupportedVisual.surface} surface is not shown in this view`;
  }

  return `Tooth ${position} ${unsupportedVisual.condition} is not shown in this view`;
}

function formatUnsupportedVisualKey(
  unsupportedVisual: ApplyToothVisualsResult['unsupportedVisuals'][number],
): string {
  return 'surface' in unsupportedVisual
    ? `surface-${unsupportedVisual.surface}`
    : `condition-${unsupportedVisual.condition}`;
}
