import type { OdontogramTooth } from '../model/odontogram';
import {
  FILLING_SURFACE_LAYER_ID_BY_MATERIAL,
  TOOTH_SURFACE_LAYER_RESET_IDS,
  deriveToothSurfaceVisualLayers,
  isSurfaceSupportedByToothView,
} from './tooth-layer-registry';

describe('tooth layer registry', () => {
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
});

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
