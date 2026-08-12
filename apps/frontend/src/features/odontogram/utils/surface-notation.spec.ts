import {
  getToothSurfaceLabel,
  getToothSurfaceNotation,
  isAnteriorTooth,
  isUpperTooth,
} from './surface-notation';

describe('surface notation', () => {
  it('uses labial and incisal terminology for anterior teeth while keeping canonical surfaces', () => {
    expect(getToothSurfaceNotation(11, 'buccal')).toEqual({
      ariaLabel: 'Labial surface',
      label: 'Labial',
      shortLabel: 'La',
      surface: 'buccal',
    });
    expect(getToothSurfaceNotation(41, 'occlusal')).toEqual({
      ariaLabel: 'Incisal surface',
      label: 'Incisal',
      shortLabel: 'I',
      surface: 'occlusal',
    });
  });

  it('uses palatal terminology for upper lingual surfaces only', () => {
    expect(getToothSurfaceLabel(16, 'lingual')).toBe('Palatal');
    expect(getToothSurfaceLabel(46, 'lingual')).toBe('Lingual');
  });

  it('keeps posterior buccal and occlusal labels canonical', () => {
    expect(getToothSurfaceLabel(16, 'buccal')).toBe('Buccal');
    expect(getToothSurfaceLabel(16, 'occlusal')).toBe('Occlusal');
  });

  it('classifies anterior and upper tooth positions', () => {
    expect(isAnteriorTooth(13)).toBe(true);
    expect(isAnteriorTooth(14)).toBe(false);
    expect(isUpperTooth(28)).toBe(true);
    expect(isUpperTooth(48)).toBe(false);
  });
});
