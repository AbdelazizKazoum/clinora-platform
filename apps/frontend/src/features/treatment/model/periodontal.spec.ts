import {
  createEmptyPeriodontalExamination,
  deriveCal,
  deriveCairoRecession,
  derivePeriodontalClassification,
  getFurcationEntrances,
  getPeriodontalTooth,
  summarizePeriodontalExamination,
  updateFurcation,
  updatePeriodontalSite,
  updatePlaque,
  updateSurfaceIndex,
} from './periodontal';

const now = new Date('2026-08-16T12:00:00.000Z');

describe('PARITY-04 periodontal model', () => {
  it('keeps six-site probing separate and derives CAL from signed GM', () => {
    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updatePeriodontalSite(examination, 16, 'B', { pd: 6, gm: 2 }, now);
    examination = updatePeriodontalSite(examination, 16, 'L', { pd: 6, gm: -3 }, now);

    const tooth = getPeriodontalTooth(examination, 16);
    expect(tooth.sites.B).toEqual({ bop: false, gm: 2, pd: 6, suppuration: false });
    const buccal = tooth.sites.B;
    const lingual = tooth.sites.L;
    if (buccal === undefined || lingual === undefined) throw new Error('Missing periodontal fixture');
    expect(deriveCal(buccal)).toBe(8);
    expect(deriveCal(lingual)).toBe(3);
    expect(tooth.sites.MB).toBeUndefined();
  });

  it('preserves uncharted versus measured healthy values and clears site flags with PD', () => {
    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updatePeriodontalSite(examination, 16, 'MB', { bop: true }, now);
    expect(getPeriodontalTooth(examination, 16).sites.MB).toBeUndefined();

    examination = updatePeriodontalSite(examination, 16, 'MB', { pd: 4, bop: true, suppuration: true }, now);
    examination = updatePeriodontalSite(examination, 16, 'MB', { pd: null }, now);
    expect(getPeriodontalTooth(examination, 16).sites.MB).toBeUndefined();
  });

  it('position-gates furcation entrances', () => {
    expect(getFurcationEntrances(16)).toEqual(['MESIAL', 'DISTAL', 'BUCCAL']);
    expect(getFurcationEntrances(46)).toEqual(['BUCCAL', 'LINGUAL']);
    expect(getFurcationEntrances(11)).toEqual([]);

    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updateFurcation(examination, 16, 'BUCCAL', 2, now);
    examination = updateFurcation(examination, 16, 'LINGUAL', 3, now);
    expect(getPeriodontalTooth(examination, 16).furcation).toEqual({ BUCCAL: 2 });
  });

  it('keeps plaque, PI/GI, and implant indices as distinct surface geometries', () => {
    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updatePlaque(examination, 16, 'BUCCAL', true, now);
    examination = updateSurfaceIndex(examination, 16, 'plaqueIndex', 'BUCCAL', 2, false, now);
    examination = updateSurfaceIndex(examination, 16, 'periImplantPlaqueIndex', 'BUCCAL', 3, false, now);
    expect(getPeriodontalTooth(examination, 16)).toMatchObject({
      plaque: ['BUCCAL'],
      plaqueIndex: { BUCCAL: 2 },
      periImplantPlaqueIndex: {},
    });
  });

  it('summarizes only charted sites and natural-tooth plaque denominator', () => {
    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updatePeriodontalSite(examination, 16, 'B', { pd: 4, bop: true }, now);
    examination = updatePeriodontalSite(examination, 16, 'DB', { pd: 6, gm: 2 }, now);
    examination = updatePlaque(examination, 16, 'BUCCAL', true, now);
    examination = updatePlaque(examination, 16, 'MESIAL', true, now);
    const summary = summarizePeriodontalExamination(examination, [16, 26]);

    expect(summary.chartedSites).toBe(2);
    expect(summary.maximumPd).toBe(6);
    expect(summary.maximumCal).toBe(8);
    expect(summary.bopPercent).toBe(50);
    expect(summary.plaquePercent).toBe(25);
  });

  it('derives Cairo recession only from approved charted inputs', () => {
    let examination = createEmptyPeriodontalExamination('doctor-1', now);
    examination = updatePeriodontalSite(examination, 11, 'B', { pd: 4, gm: 2 }, now);
    examination = updatePeriodontalSite(examination, 11, 'MB', { pd: 4, gm: 0 }, now);
    examination = updatePeriodontalSite(examination, 11, 'DB', { pd: 4, gm: 0 }, now);
    expect(deriveCairoRecession(getPeriodontalTooth(examination, 11))).toBe('RT2');
  });

  it('does not release a periodontal classification without clinical approval', () => {
    expect(derivePeriodontalClassification()).toEqual({
      diagnosis: null,
      extent: null,
      grade: null,
      reason: '2017 periodontal classification requires explicit clinical approval before release.',
      stage: null,
      status: 'NOT_CLINICALLY_APPROVED',
    });
  });
});
