import {
  RESTORATION_LAYER_MATRIX,
  RESTORATION_LAYER_RESET_IDS,
  composeRestorationLayers,
} from './restoration-layers';

describe('restoration layers', () => {
  it('maps crown materials to crown layers', () => {
    expect(
      composeRestorationLayers({
        material: 'zircon',
        restoration: 'crown',
        view: 'side',
      }),
    ).toEqual({ layerIds: ['zircon-crown'] });
  });

  it('maps telescope crowns to all required child layers', () => {
    expect(
      composeRestorationLayers({
        material: 'telescope',
        restoration: 'crown',
        view: 'side',
      }),
    ).toEqual({
      layerIds: [
        'telescope-crown',
        'telescope-crown-inside',
        'telescope-crown-outside',
      ],
    });
  });

  it('maps inlay and veneer partial restorations to material-specific layers', () => {
    expect(
      composeRestorationLayers({
        material: 'gold',
        restoration: 'inlay',
        view: 'side',
      }),
    ).toEqual({ layerIds: ['gold-inlay'] });
    expect(
      composeRestorationLayers({
        material: 'emax',
        restoration: 'veneer',
        view: 'side',
      }),
    ).toEqual({ layerIds: ['emax-veneer'] });
  });

  it('makes onlay explicitly occlusal-only', () => {
    expect(
      composeRestorationLayers({
        material: 'gradia',
        restoration: 'onlay',
        view: 'side',
      }),
    ).toEqual({ layerIds: [], unsupportedReason: 'unsupported-view' });
    expect(
      composeRestorationLayers({
        material: 'gradia',
        restoration: 'onlay',
        view: 'occlusal',
      }),
    ).toEqual({ layerIds: ['gradia-onlay'] });
  });

  it('keeps the approved material matrix explicit', () => {
    expect(RESTORATION_LAYER_MATRIX.crown.materials).toEqual([
      'emax',
      'gold',
      'gradia',
      'zircon',
      'metal',
      'metal-ceramic',
      'telescope',
      'temporary',
    ]);
    expect(RESTORATION_LAYER_MATRIX.onlay.materials).toEqual([
      'emax',
      'gold',
      'gradia',
      'zircon',
      'temporary',
    ]);
  });

  it('includes every fixed restoration layer and implant connector in the reset set', () => {
    expect(RESTORATION_LAYER_RESET_IDS).toContain('implant-connector');
    expect(RESTORATION_LAYER_RESET_IDS).toContain('metal-ceramic-crown');
    expect(RESTORATION_LAYER_RESET_IDS).toContain('telescope-crown-inside');
    expect(RESTORATION_LAYER_RESET_IDS).toContain('temporary-onlay');
    expect(new Set(RESTORATION_LAYER_RESET_IDS).size).toBe(
      RESTORATION_LAYER_RESET_IDS.length,
    );
  });
});
