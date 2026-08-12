import type { OdontogramTooth } from '../model/odontogram';
import type { ToothSvgTemplateView } from './svg-template-loader';
import {
  TOOTH_SURFACE_LAYER_RESET_IDS,
  deriveToothSurfaceVisualLayers,
  type ToothSurfaceVisualLayer,
  type UnsupportedToothSurfaceVisual,
} from './tooth-layer-registry';

export interface ApplyToothVisualsOptions {
  readonly svg: SVGSVGElement;
  readonly tooth: OdontogramTooth;
  readonly view: ToothSvgTemplateView;
  readonly layerIdByOriginalId: ReadonlyMap<string, string>;
}

export interface ApplyToothVisualsResult {
  readonly activeLayerIds: readonly string[];
  readonly unsupportedSurfaces: readonly UnsupportedToothSurfaceVisual[];
}

export function applyToothVisuals({
  svg,
  tooth,
  view,
  layerIdByOriginalId,
}: ApplyToothVisualsOptions): ApplyToothVisualsResult {
  resetSurfaceLayers(svg, layerIdByOriginalId);

  const result = deriveToothSurfaceVisualLayers(tooth, view);
  for (const layer of result.layers) {
    activateSurfaceLayer(svg, layerIdByOriginalId, layer);
  }

  return {
    activeLayerIds: result.layers.map((layer) => layer.id),
    unsupportedSurfaces: result.unsupportedSurfaces,
  };
}

function resetSurfaceLayers(
  svg: SVGSVGElement,
  layerIdByOriginalId: ReadonlyMap<string, string>,
): void {
  for (const layerId of TOOTH_SURFACE_LAYER_RESET_IDS) {
    const layerElement = findLayerElement(svg, layerIdByOriginalId, layerId);
    if (layerElement === null) {
      continue;
    }

    layerElement.setAttribute('data-active', '0');
    layerElement.removeAttribute('data-odontogram-appearance');
    layerElement.removeAttribute('data-odontogram-caries-severity');
    layerElement.classList.remove('caries-deep');
    layerElement.style.removeProperty('opacity');
  }
}

function activateSurfaceLayer(
  svg: SVGSVGElement,
  layerIdByOriginalId: ReadonlyMap<string, string>,
  layer: ToothSurfaceVisualLayer,
): void {
  const layerElement = findLayerElement(svg, layerIdByOriginalId, layer.id);
  if (layerElement === null) {
    return;
  }

  layerElement.setAttribute('data-active', '1');
  layerElement.setAttribute('data-odontogram-appearance', layer.appearance);

  if (layer.kind === 'caries') {
    const severity = layer.severity ?? 2;
    layerElement.setAttribute(
      'data-odontogram-caries-severity',
      String(severity),
    );
    layerElement.style.opacity = getPrimaryCariesOpacity(severity);
    layerElement.classList.toggle('caries-deep', severity >= 5);
    return;
  }

  if (layer.kind === 'subcaries') {
    const severity = layer.severity ?? 2;
    layerElement.setAttribute(
      'data-odontogram-caries-severity',
      String(severity),
    );
    layerElement.style.opacity = getRecurrentCariesOpacity(severity);
  }
}

function findLayerElement(
  svg: SVGSVGElement,
  layerIdByOriginalId: ReadonlyMap<string, string>,
  originalLayerId: string,
): SVGElement | null {
  const namespacedId = layerIdByOriginalId.get(originalLayerId);
  const targetId = namespacedId ?? originalLayerId;

  for (const element of [svg, ...Array.from(svg.querySelectorAll('[id]'))]) {
    if (element.getAttribute('id') === targetId) {
      return element as SVGElement;
    }
  }

  for (const element of Array.from(
    svg.querySelectorAll('[data-odontogram-layer]'),
  )) {
    if (element.getAttribute('data-odontogram-layer') === originalLayerId) {
      return element as SVGElement;
    }
  }

  return null;
}

function getPrimaryCariesOpacity(severity: 1 | 2 | 3 | 4 | 5 | 6): string {
  if (severity >= 5) {
    return '1';
  }

  return severity >= 3 ? '0.7' : '0.45';
}

function getRecurrentCariesOpacity(severity: 1 | 2 | 3 | 4 | 5 | 6): string {
  const opacity = 0.3 + ((severity - 1) / 5) * 0.7;

  return String(Math.round(opacity * 100) / 100);
}
