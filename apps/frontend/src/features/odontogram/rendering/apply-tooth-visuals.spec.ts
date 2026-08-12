import type { OdontogramTooth } from '../model/odontogram';
import { namespaceSvgIds } from './svg-id-namespace';
import { applyToothVisuals } from './apply-tooth-visuals';

describe('applyToothVisuals', () => {
  it('activates primary caries with severity styling and scoped planned appearance', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');
    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'planned',
          kind: 'caries',
          severity: 5,
          surface: 'occlusal',
        },
      ]),
      view: 'side',
    });

    const cariesLayer = getLayer(template.svg, 'caries-occlusal');
    const subcariesLayer = getLayer(template.svg, 'subcaries-occlusal');

    expect(result.activeLayerIds).toEqual(['caries-occlusal']);
    expect(cariesLayer.getAttribute('data-active')).toBe('1');
    expect(cariesLayer.getAttribute('data-odontogram-appearance')).toBe(
      'planned',
    );
    expect(cariesLayer.getAttribute('data-odontogram-caries-severity')).toBe(
      '5',
    );
    expect(cariesLayer.style.opacity).toBe('1');
    expect(cariesLayer.classList.contains('caries-deep')).toBe(true);
    expect(subcariesLayer.getAttribute('data-active')).toBe('0');
  });

  it('activates filling and recurrent subcaries instead of primary caries on the same surface', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'existing',
          kind: 'filling',
          material: 'composite',
          surface: 'mesial',
        },
        {
          appearance: 'planned',
          kind: 'caries',
          severity: 6,
          surface: 'mesial',
        },
      ]),
      view: 'side',
    });

    expect(
      getLayer(template.svg, 'filling-composite-mesial').getAttribute(
        'data-active',
      ),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'subcaries-mesial').getAttribute('data-active'),
    ).toBe('1');
    expect(getLayer(template.svg, 'subcaries-mesial').style.opacity).toBe('1');
    expect(
      getLayer(template.svg, 'caries-mesial').getAttribute('data-active'),
    ).toBe('0');
  });

  it('clears stale layers when the supplied tooth changes', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'existing',
          kind: 'filling',
          material: 'amalgam',
          surface: 'distal',
        },
      ]),
      view: 'side',
    });
    expect(
      getLayer(template.svg, 'filling-amalgam-distal').getAttribute(
        'data-active',
      ),
    ).toBe('1');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, []),
      view: 'side',
    });

    expect(
      getLayer(template.svg, 'filling-amalgam-distal').getAttribute(
        'data-active',
      ),
    ).toBe('0');
  });

  it('reports unsupported side lingual layers without activating hidden geometry', () => {
    const template = createNamespacedFixture('chart-a', 11, 'side');
    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(11, [
        {
          appearance: 'existing',
          kind: 'caries',
          surface: 'lingual',
        },
      ]),
      view: 'side',
    });

    expect(result.unsupportedSurfaces).toEqual([
      { reason: 'unsupported-template-surface', surface: 'lingual' },
    ]);
    expect(template.svg.querySelector('[data-active="1"]')).toBeNull();
  });
});

function createNamespacedFixture(
  namespacePrefix: string,
  toothPosition: number,
  view: string,
) {
  return namespaceSvgIds(createSvgFixture(), {
    namespacePrefix,
    toothPosition,
    view,
  });
}

function createSvgFixture(): SVGSVGElement {
  return new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" id="template">
      <path id="caries-occlusal" data-active="0" />
      <path id="caries-mesial" data-active="0" />
      <path id="subcaries-occlusal" data-active="0" style="opacity: .4" />
      <path id="subcaries-mesial" data-active="0" />
      <path id="filling-amalgam-distal" data-active="0" />
      <path id="filling-composite-mesial" data-active="0" />
    </svg>`,
    'image/svg+xml',
  ).documentElement as unknown as SVGSVGElement;
}

function getLayer(svg: SVGSVGElement, originalLayerId: string): SVGElement {
  const layer = svg.querySelector(
    `[data-odontogram-layer="${originalLayerId}"]`,
  );
  if (layer === null) {
    throw new Error(`Expected layer ${originalLayerId}`);
  }

  return layer as SVGElement;
}

function tooth(
  position: OdontogramTooth['position'],
  conditions: OdontogramTooth['conditions'],
): OdontogramTooth {
  return {
    base: 'natural',
    conditions,
    position,
  };
}
