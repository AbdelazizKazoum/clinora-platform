import type { OdontogramTooth } from '../model/odontogram';
import {
  FILLING_SURFACE_LAYER_ID_BY_MATERIAL,
  TOOTH_SURFACE_LAYER_RESET_IDS,
  TOOTH_WHOLE_LAYER_RESET_IDS,
  deriveToothSurfaceVisualLayers,
  deriveToothVisualLayers,
  deriveWholeToothVisualLayers,
  isSurfaceSupportedByToothView,
} from './tooth-layer-registry';

describe('tooth layer registry', () => {
  it('maps natural, missing, and implant bases deterministically', () => {
    expect(
      deriveWholeToothVisualLayers(tooth(16, [], 'natural'), 'side'),
    ).toEqual({
      layers: [
        { id: 'base', kind: 'base' },
        { id: 'tooth-base', kind: 'base' },
        { id: 'tooth-base-beauty', kind: 'base' },
        { id: 'tooth-healthy-pulp', kind: 'base' },
      ],
      unsupportedVisuals: [],
    });
    expect(
      deriveWholeToothVisualLayers(tooth(16, [], 'missing'), 'side'),
    ).toEqual({
      layers: [{ id: 'base', kind: 'base' }],
      unsupportedVisuals: [],
    });
    expect(
      deriveWholeToothVisualLayers(tooth(16, [], 'implant'), 'side'),
    ).toEqual({
      layers: [
        { id: 'base', kind: 'base' },
        { id: 'implant', kind: 'base' },
        { id: 'implant-base', kind: 'base' },
      ],
      unsupportedVisuals: [],
    });
  });

  it('maps planned extraction and side-view root canal to named layers', () => {
    expect(
      deriveWholeToothVisualLayers(
        tooth(16, [
          { appearance: 'planned', kind: 'extraction' },
          {
            appearance: 'existing',
            kind: 'endodontic',
            state: 'root-canal',
          },
        ]),
        'side',
      ).layers,
    ).toEqual([
      { id: 'base', kind: 'base' },
      { id: 'tooth-base', kind: 'base' },
      { id: 'tooth-base-beauty', kind: 'base' },
      { id: 'tooth-healthy-pulp', kind: 'base' },
      {
        appearance: 'planned',
        id: 'extraction-plan',
        kind: 'extraction',
      },
      {
        appearance: 'existing',
        id: 'endo-filling',
        kind: 'endodontic',
      },
    ]);
  });

  it('reports root canal as unsupported in occlusal roots', () => {
    expect(
      deriveWholeToothVisualLayers(
        tooth(16, [
          {
            appearance: 'existing',
            kind: 'endodontic',
            state: 'root-canal',
          },
        ]),
        'occlusal',
      ).unsupportedVisuals,
    ).toEqual([
      { condition: 'root-canal', reason: 'unsupported-template-view' },
    ]);
  });

  it('combines whole-tooth and surface visual layers', () => {
    expect(
      deriveToothVisualLayers(
        tooth(16, [
          {
            appearance: 'existing',
            kind: 'filling',
            material: 'amalgam',
            surface: 'occlusal',
          },
        ]),
        'side',
      ).layers.map((layer) => layer.id),
    ).toEqual([
      'base',
      'tooth-base',
      'tooth-base-beauty',
      'tooth-healthy-pulp',
      'filling-amalgam-occlusal',
    ]);
  });

  it('maps fixed restoration layers with supplied appearance', () => {
    expect(
      deriveToothVisualLayers(
        tooth(16, [
          {
            appearance: 'planned',
            kind: 'restoration',
            material: 'telescope',
            restoration: 'crown',
          },
        ]),
        'side',
      ).layers,
    ).toEqual([
      { id: 'base', kind: 'base' },
      { id: 'tooth-base', kind: 'base' },
      { id: 'tooth-base-beauty', kind: 'base' },
      { id: 'tooth-healthy-pulp', kind: 'base' },
      {
        appearance: 'planned',
        id: 'telescope-crown',
        kind: 'restoration',
      },
      {
        appearance: 'planned',
        id: 'telescope-crown-inside',
        kind: 'restoration',
      },
      {
        appearance: 'planned',
        id: 'telescope-crown-outside',
        kind: 'restoration',
      },
    ]);
  });

  it('adds the implant connector for an implant crown', () => {
    expect(
      deriveToothVisualLayers(
        tooth(
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
        'side',
      ).layers.map((layer) => layer.id),
    ).toEqual([
      'base',
      'implant',
      'implant-base',
      'zircon-crown',
      'implant-connector',
    ]);
  });

  it('reports onlay as unsupported in side roots and renderable in occlusal roots', () => {
    const sideResult = deriveToothVisualLayers(
      tooth(16, [
        {
          appearance: 'existing',
          kind: 'restoration',
          material: 'gold',
          restoration: 'onlay',
        },
      ]),
      'side',
    );
    const occlusalResult = deriveToothVisualLayers(
      tooth(16, [
        {
          appearance: 'existing',
          kind: 'restoration',
          material: 'gold',
          restoration: 'onlay',
        },
      ]),
      'occlusal',
    );

    expect(sideResult.layers.map((layer) => layer.id)).not.toContain(
      'gold-onlay',
    );
    expect(sideResult.unsupportedVisuals).toEqual([
      { condition: 'onlay', reason: 'unsupported-template-view' },
    ]);
    expect(occlusalResult.layers.map((layer) => layer.id)).toContain(
      'gold-onlay',
    );
    expect(occlusalResult.unsupportedVisuals).toEqual([]);
  });

  it('maps primary caries to caries surface layers with supplied appearance and severity', () => {
    expect(
      deriveToothSurfaceVisualLayers(
        tooth(16, [
          {
            appearance: 'planned',
            kind: 'caries',
            severity: 5,
            surface: 'occlusal',
          },
        ]),
        'side',
      ).layers,
    ).toEqual([
      {
        appearance: 'planned',
        id: 'caries-occlusal',
        kind: 'caries',
        severity: 5,
        surface: 'occlusal',
      },
    ]);
  });

  it('maps each supported filling material through explicit layer IDs', () => {
    expect(FILLING_SURFACE_LAYER_ID_BY_MATERIAL.amalgam.occlusal).toBe(
      'filling-amalgam-occlusal',
    );
    expect(FILLING_SURFACE_LAYER_ID_BY_MATERIAL.composite.mesial).toBe(
      'filling-composite-mesial',
    );
    expect(FILLING_SURFACE_LAYER_ID_BY_MATERIAL.gic.distal).toBe(
      'filling-gic-distal',
    );
    expect(FILLING_SURFACE_LAYER_ID_BY_MATERIAL.temporary.buccal).toBe(
      'filling-temporary-buccal',
    );
  });

  it('renders recurrent caries as subcaries when a filling shares the surface', () => {
    expect(
      deriveToothSurfaceVisualLayers(
        tooth(16, [
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
        'side',
      ).layers,
    ).toEqual([
      {
        appearance: 'existing',
        id: 'filling-composite-mesial',
        kind: 'filling',
        surface: 'mesial',
      },
      {
        appearance: 'planned',
        id: 'subcaries-mesial',
        kind: 'subcaries',
        severity: 6,
        surface: 'mesial',
      },
    ]);
  });

  it('reports unsupported lingual layers for side roots without inventing alternate IDs', () => {
    const result = deriveToothSurfaceVisualLayers(
      tooth(11, [
        {
          appearance: 'existing',
          kind: 'caries',
          surface: 'lingual',
        },
      ]),
      'side',
    );

    expect(result.layers).toEqual([]);
    expect(result.unsupportedSurfaces).toEqual([
      { reason: 'unsupported-template-surface', surface: 'lingual' },
    ]);
  });

  it('supports posterior lingual surfaces on occlusal roots only', () => {
    expect(isSurfaceSupportedByToothView(16, 'side', 'lingual')).toBe(false);
    expect(isSurfaceSupportedByToothView(16, 'occlusal', 'lingual')).toBe(true);
    expect(isSurfaceSupportedByToothView(11, 'occlusal', 'lingual')).toBe(
      false,
    );
  });

  it('includes the complete known reset set for caries, subcaries, and filling layers', () => {
    expect(TOOTH_SURFACE_LAYER_RESET_IDS).toContain('caries-buccal');
    expect(TOOTH_SURFACE_LAYER_RESET_IDS).toContain('subcaries-lingual');
    expect(TOOTH_SURFACE_LAYER_RESET_IDS).toContain(
      'filling-temporary-occlusal',
    );
    expect(new Set(TOOTH_SURFACE_LAYER_RESET_IDS).size).toBe(
      TOOTH_SURFACE_LAYER_RESET_IDS.length,
    );
  });

  it('includes the complete known reset set for whole-tooth layers', () => {
    expect(TOOTH_WHOLE_LAYER_RESET_IDS).toEqual([
      'base',
      'tooth-base',
      'tooth-base-beauty',
      'tooth-healthy-pulp',
      'tooth-inflam-pulp',
      'implant',
      'implant-base',
      'extraction-plan',
      'endo-filling',
    ]);
  });
});

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
