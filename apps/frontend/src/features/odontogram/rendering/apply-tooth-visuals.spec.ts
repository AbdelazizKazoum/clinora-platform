import type { OdontogramTooth } from '../model/odontogram';
import { namespaceSvgIds } from './svg-id-namespace';
import { applyToothVisuals } from './apply-tooth-visuals';

describe('applyToothVisuals', () => {
  it('activates natural base layers and clears implant or extraction leftovers', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');
    getLayer(template.svg, 'implant').setAttribute('data-active', '1');
    getLayer(template.svg, 'extraction-plan').setAttribute('data-active', '1');

    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, []),
      view: 'side',
    });

    expect(result.activeLayerIds).toEqual([
      'base',
      'tooth-base',
      'tooth-base-beauty',
      'tooth-healthy-pulp',
    ]);
    expect(
      getLayer(template.svg, 'tooth-base').getAttribute('data-active'),
    ).toBe('1');
    expect(getLayer(template.svg, 'implant').getAttribute('data-active')).toBe(
      '0',
    );
    expect(
      getLayer(template.svg, 'extraction-plan').getAttribute('data-active'),
    ).toBe('0');
  });

  it('activates implant base without treating it as a planned implant', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [], 'implant'),
      view: 'side',
    });

    expect(result.activeLayerIds).toEqual(['base', 'implant', 'implant-base']);
    expect(getLayer(template.svg, 'implant').getAttribute('data-active')).toBe(
      '1',
    );
    expect(
      getLayer(template.svg, 'implant').getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBeNull();
    expect(
      getLayer(template.svg, 'tooth-base').getAttribute('data-active'),
    ).toBe('0');
  });

  it('renders missing base by suppressing natural and implant anatomy', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [], 'missing'),
      view: 'side',
    });

    expect(result.activeLayerIds).toEqual(['base']);
    expect(getLayer(template.svg, 'base').getAttribute('data-active')).toBe(
      '1',
    );
    expect(
      getLayer(template.svg, 'tooth-base').getAttribute('data-active'),
    ).toBe('0');
    expect(getLayer(template.svg, 'implant').getAttribute('data-active')).toBe(
      '0',
    );
  });

  it('activates planned extraction and root-canal side-view layers with appearance', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        { appearance: 'planned', kind: 'extraction' },
        {
          appearance: 'existing',
          kind: 'endodontic',
          state: 'root-canal',
        },
      ]),
      view: 'side',
    });

    expect(
      getLayer(template.svg, 'extraction-plan').getAttribute('data-active'),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'extraction-plan').getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('planned');
    expect(
      getLayer(template.svg, 'endo-filling').getAttribute('data-active'),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'endo-filling').getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('existing');
  });

  it('activates fixed restoration layers with planned styling only from visual input', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'planned',
          kind: 'restoration',
          material: 'telescope',
          restoration: 'crown',
        },
      ]),
      view: 'side',
    });

    expect(result.activeLayerIds).toEqual([
      'base',
      'tooth-base',
      'tooth-base-beauty',
      'tooth-healthy-pulp',
      'telescope-crown',
      'telescope-crown-inside',
      'telescope-crown-outside',
    ]);
    expect(
      getLayer(template.svg, 'telescope-crown').getAttribute('data-active'),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'telescope-crown-inside').getAttribute(
        'data-active',
      ),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'telescope-crown').getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('planned');
  });

  it('activates implant connector with implant crown to avoid a floating crown', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(
        16,
        [
          {
            appearance: 'existing',
            kind: 'restoration',
            material: 'zircon',
            restoration: 'crown',
          },
        ],
        'implant',
      ),
      view: 'side',
    });

    expect(getLayer(template.svg, 'implant').getAttribute('data-active')).toBe(
      '1',
    );
    expect(
      getLayer(template.svg, 'implant-connector').getAttribute('data-active'),
    ).toBe('1');
    expect(
      getLayer(template.svg, 'zircon-crown').getAttribute('data-active'),
    ).toBe('1');
  });

  it('reports side-view onlay as unsupported instead of silently hiding it', () => {
    const template = createNamespacedFixture('chart-a', 16, 'side');
    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'existing',
          kind: 'restoration',
          material: 'temporary',
          restoration: 'onlay',
        },
      ]),
      view: 'side',
    });

    expect(result.unsupportedVisuals).toEqual([
      { condition: 'onlay', reason: 'unsupported-template-view' },
    ]);
    expect(
      getLayer(template.svg, 'temporary-onlay').getAttribute('data-active'),
    ).toBe('0');
  });

  it('renders onlay on occlusal roots and clears stale restoration layers', () => {
    const template = createNamespacedFixture('chart-a', 16, 'occlusal');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'existing',
          kind: 'restoration',
          material: 'temporary',
          restoration: 'onlay',
        },
      ]),
      view: 'occlusal',
    });
    expect(
      getLayer(template.svg, 'temporary-onlay').getAttribute('data-active'),
    ).toBe('1');

    applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, []),
      view: 'occlusal',
    });

    expect(
      getLayer(template.svg, 'temporary-onlay').getAttribute('data-active'),
    ).toBe('0');
  });

  it('reports root-canal as unsupported on occlusal roots without activating an endodontic layer', () => {
    const template = createNamespacedFixture('chart-a', 16, 'occlusal');
    const result = applyToothVisuals({
      layerIdByOriginalId: template.layerIdByOriginalId,
      svg: template.svg,
      tooth: tooth(16, [
        {
          appearance: 'existing',
          kind: 'endodontic',
          state: 'root-canal',
        },
      ]),
      view: 'occlusal',
    });

    expect(result.unsupportedVisuals).toEqual([
      { condition: 'root-canal', reason: 'unsupported-template-view' },
    ]);
    expect(
      getLayer(template.svg, 'endo-filling').getAttribute('data-active'),
    ).toBe('0');
  });

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

    expect(result.activeLayerIds).toEqual([
      'base',
      'tooth-base',
      'tooth-base-beauty',
      'tooth-healthy-pulp',
      'caries-occlusal',
    ]);
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

    expect(result.unsupportedVisuals).toEqual([
      { reason: 'unsupported-template-surface', surface: 'lingual' },
    ]);
    expect(
      getLayer(template.svg, 'caries-lingual').getAttribute('data-active'),
    ).toBe('0');
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
      <g id="base" data-active="0" />
      <path id="tooth-base" data-active="1" />
      <path id="tooth-base-beauty" data-active="1" />
      <path id="tooth-healthy-pulp" data-active="1" />
      <path id="tooth-inflam-pulp" data-active="1" />
      <g id="implant" data-active="0" />
      <path id="implant-base" data-active="0" />
      <path id="extraction-plan" data-active="0" />
      <path id="endo-filling" data-active="0" />
      <path id="zircon-crown" data-active="0" />
      <path id="temporary-onlay" data-active="0" />
      <g id="telescope-crown" data-active="0" />
      <path id="telescope-crown-inside" data-active="0" />
      <path id="telescope-crown-outside" data-active="0" />
      <path id="implant-connector" data-active="0" />
      <path id="caries-occlusal" data-active="0" />
      <path id="caries-mesial" data-active="0" />
      <path id="caries-lingual" data-active="0" />
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
  base: OdontogramTooth['base'] = 'natural',
): OdontogramTooth {
  return {
    base,
    conditions,
    position,
  };
}
