import {
  buildPeriodontalArchLayout,
  buildPeriodontalCurvePoints,
  PERIODONTAL_LOWER_ARCH,
  PERIODONTAL_UPPER_ARCH,
} from './periodontal-arch-layout';

describe('periodontal arch layout', () => {
  it('keeps upper and lower FDI order stable and responsive to width', () => {
    const upper = buildPeriodontalArchLayout('upper', 'buccal', 800);
    const lower = buildPeriodontalArchLayout('lower', 'lingual', 400);
    expect(upper.map(({ toothNumber }) => toothNumber)).toEqual(PERIODONTAL_UPPER_ARCH);
    expect(lower.map(({ toothNumber }) => toothNumber)).toEqual(PERIODONTAL_LOWER_ARCH);
    expect(upper.at(-1)?.x).toBeGreaterThan(lower.at(-1)?.x ?? 0);
  });

  it('leaves uncharted gaps out of curve points', () => {
    const layout = buildPeriodontalArchLayout('upper', 'buccal');
    const values = new Map<number, number | null>([[18, 4], [17, null], [16, 6]]);
    expect(buildPeriodontalCurvePoints(layout.slice(0, 3), values, 0)).toContain('24,76');
    expect(buildPeriodontalCurvePoints(layout.slice(0, 3), values, 0).split(' ')).toHaveLength(2);
  });
});
