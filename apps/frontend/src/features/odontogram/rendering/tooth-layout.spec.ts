import { TOOTH_POSITIONS, type ToothPosition } from '../model/odontogram';
import {
  LOWER_ARCH_POSITIONS,
  TOOTH_LAYOUTS,
  TOOTH_LAYOUT_BY_POSITION,
  UPPER_ARCH_POSITIONS,
  getToothLayout,
  hasOcclusalToothView,
  isAnteriorToothPosition,
  type ToothLayout,
} from './tooth-layout';

const EXPECTED_LAYOUTS = [
  [18, 'upper', 1, 8, 16, 16, 0, false],
  [17, 'upper', 1, 7, 16, 16, 0, false],
  [16, 'upper', 1, 6, 16, 16, 0, false],
  [15, 'upper', 1, 5, 14, 14, 0, false],
  [14, 'upper', 1, 4, 14, 14, 0, false],
  [13, 'upper', 1, 3, 13, null, 0, false],
  [12, 'upper', 1, 2, 11, null, 0, false],
  [11, 'upper', 1, 1, 11, null, 0, false],
  [21, 'upper', 2, 1, 11, null, 0, true],
  [22, 'upper', 2, 2, 11, null, 0, true],
  [23, 'upper', 2, 3, 13, null, 0, true],
  [24, 'upper', 2, 4, 14, 14, 0, true],
  [25, 'upper', 2, 5, 14, 14, 0, true],
  [26, 'upper', 2, 6, 16, 16, 0, true],
  [27, 'upper', 2, 7, 16, 16, 0, true],
  [28, 'upper', 2, 8, 16, 16, 0, true],
  [48, 'lower', 4, 8, 16, 16, 180, true],
  [47, 'lower', 4, 7, 16, 16, 180, true],
  [46, 'lower', 4, 6, 16, 16, 180, true],
  [45, 'lower', 4, 5, 14, 14, 180, true],
  [44, 'lower', 4, 4, 14, 14, 180, true],
  [43, 'lower', 4, 3, 13, null, 180, true],
  [42, 'lower', 4, 2, 11, null, 180, true],
  [41, 'lower', 4, 1, 11, null, 180, true],
  [31, 'lower', 3, 1, 11, null, 180, false],
  [32, 'lower', 3, 2, 11, null, 180, false],
  [33, 'lower', 3, 3, 13, null, 180, false],
  [34, 'lower', 3, 4, 14, 14, 180, false],
  [35, 'lower', 3, 5, 14, 14, 180, false],
  [36, 'lower', 3, 6, 16, 16, 180, false],
  [37, 'lower', 3, 7, 16, 16, 180, false],
  [38, 'lower', 3, 8, 16, 16, 180, false],
] as const satisfies readonly (readonly [
  ToothPosition,
  ToothLayout['arch'],
  ToothLayout['quadrant'],
  ToothLayout['quadrantPosition'],
  ToothLayout['sideTemplate'],
  ToothLayout['occlusalTemplate'],
  ToothLayout['rotation'],
  ToothLayout['mirror'],
])[];

describe('tooth-layout', () => {
  it('keeps the permanent chart order from the visual model', () => {
    expect(TOOTH_LAYOUTS.map((layout) => layout.position)).toEqual([
      ...TOOTH_POSITIONS,
    ]);
    expect(UPPER_ARCH_POSITIONS).toEqual(TOOTH_POSITIONS.slice(0, 16));
    expect(LOWER_ARCH_POSITIONS).toEqual(TOOTH_POSITIONS.slice(16));
  });

  it.each(EXPECTED_LAYOUTS)(
    'maps FDI %i to legacy template metadata',
    (
      position,
      arch,
      quadrant,
      quadrantPosition,
      sideTemplate,
      occlusalTemplate,
      rotation,
      mirror,
    ) => {
      expect(getToothLayout(position)).toMatchObject({
        position,
        arch,
        quadrant,
        quadrantPosition,
        sideTemplate,
        occlusalTemplate,
        hasOcclusalView: occlusalTemplate !== null,
        rotation,
        mirror,
      });
    },
  );

  it('classifies anterior and posterior positions without adding incisal numbers', () => {
    const anteriorPositions: readonly ToothPosition[] = [
      13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33,
    ];
    const posteriorPositions = TOOTH_POSITIONS.filter(
      (position) => !anteriorPositions.includes(position),
    );

    expect(anteriorPositions.every(isAnteriorToothPosition)).toBe(true);
    expect(posteriorPositions.some(isAnteriorToothPosition)).toBe(false);
  });

  it('marks only premolars and molars as having an occlusal view', () => {
    const occlusalPositions = TOOTH_POSITIONS.filter(
      (position) => position % 10 >= 4,
    );
    const nonOcclusalPositions = TOOTH_POSITIONS.filter(
      (position) => position % 10 <= 3,
    );

    expect(occlusalPositions.every(hasOcclusalToothView)).toBe(true);
    expect(nonOcclusalPositions.some(hasOcclusalToothView)).toBe(false);
  });

  it('keeps template counts aligned with the six legacy archetype assets', () => {
    const sideCounts = countBy(
      TOOTH_LAYOUTS.map((layout) => layout.sideTemplate),
    );
    const occlusalCounts = countBy(
      TOOTH_LAYOUTS.flatMap((layout) =>
        layout.occlusalTemplate === null ? [] : [layout.occlusalTemplate],
      ),
    );

    expect(sideCounts).toEqual({ 11: 8, 13: 4, 14: 8, 16: 12 });
    expect(occlusalCounts).toEqual({ 14: 8, 16: 12 });
  });

  it('exposes immutable layout metadata', () => {
    expect(Object.isFrozen(TOOTH_LAYOUTS)).toBe(true);
    expect(Object.isFrozen(TOOTH_LAYOUT_BY_POSITION)).toBe(true);
    expect(TOOTH_LAYOUTS.every((layout) => Object.isFrozen(layout))).toBe(true);
  });

  it('resolves the same immutable layout instance through the position index', () => {
    for (const layout of TOOTH_LAYOUTS) {
      expect(TOOTH_LAYOUT_BY_POSITION[layout.position]).toBe(layout);
      expect(getToothLayout(layout.position)).toBe(layout);
    }
  });
});

function countBy(values: readonly number[]): Record<number, number> {
  return values.reduce<Record<number, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
