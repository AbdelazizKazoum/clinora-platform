import { TOOTH_POSITIONS, type ToothPosition } from '../model/odontogram';
import { formatToothNumber } from './tooth-numbering';

describe('tooth-numbering', () => {
  it('formats every permanent position as FDI', () => {
    expect(formatAll('fdi')).toEqual(TOOTH_POSITIONS.map(String));
  });

  it('formats every permanent position as Universal', () => {
    expect(formatAll('universal')).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '32',
      '31',
      '30',
      '29',
      '28',
      '27',
      '26',
      '25',
      '24',
      '23',
      '22',
      '21',
      '20',
      '19',
      '18',
      '17',
    ]);
  });

  it('formats every permanent position as Palmer quadrant-position text', () => {
    expect(formatAll('palmer')).toEqual([
      'UR-8',
      'UR-7',
      'UR-6',
      'UR-5',
      'UR-4',
      'UR-3',
      'UR-2',
      'UR-1',
      'UL-1',
      'UL-2',
      'UL-3',
      'UL-4',
      'UL-5',
      'UL-6',
      'UL-7',
      'UL-8',
      'LR-8',
      'LR-7',
      'LR-6',
      'LR-5',
      'LR-4',
      'LR-3',
      'LR-2',
      'LR-1',
      'LL-1',
      'LL-2',
      'LL-3',
      'LL-4',
      'LL-5',
      'LL-6',
      'LL-7',
      'LL-8',
    ]);
  });

  it.each([
    [18, '1', 'UR-8'],
    [11, '8', 'UR-1'],
    [21, '9', 'UL-1'],
    [28, '16', 'UL-8'],
    [38, '17', 'LL-8'],
    [31, '24', 'LL-1'],
    [41, '25', 'LR-1'],
    [48, '32', 'LR-8'],
  ] as const)(
    'matches legacy adult numbering fixtures for FDI %i',
    (position, universal, palmer) => {
      expect(formatToothNumber(position, 'universal')).toBe(universal);
      expect(formatToothNumber(position, 'palmer')).toBe(palmer);
    },
  );

  it('remaps primary labels without changing the permanent position key', () => {
    expect(formatToothNumber(11, 'fdi', 'primary')).toBe('51');
    expect(formatToothNumber(15, 'universal', 'primary')).toBe('E');
    expect(formatToothNumber(15, 'palmer', 'primary')).toBe('UR-5');
  });
});

function formatAll(
  system: Parameters<typeof formatToothNumber>[1],
): readonly string[] {
  return TOOTH_POSITIONS.map((position: ToothPosition) =>
    formatToothNumber(position, system),
  );
}
