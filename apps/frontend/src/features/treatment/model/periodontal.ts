import type {
  FurcationEntrance,
  IndexSurface,
  PeriodontalSite,
} from './treatment';

export const PERIODONTAL_SITES: readonly PeriodontalSite[] = [
  'MB',
  'B',
  'DB',
  'ML',
  'L',
  'DL',
];

export const PERIODONTAL_INDEX_SURFACES: readonly IndexSurface[] = [
  'BUCCAL',
  'LINGUAL',
  'MESIAL',
  'DISTAL',
];

export const FURCATION_GRADES = [1, 2, 3, 4] as const;
export const PERIODONTAL_GRADES = [1, 2, 3] as const;
export const MILLER_CLASSES = ['I', 'II', 'III', 'IV'] as const;
export const CEJ_VISIBILITY_VALUES = ['DETECTABLE', 'NOT_DETECTABLE'] as const;
export const ROOT_CONCAVITY_VALUES = ['NONE', 'MILD', 'DEEP'] as const;
export const GINGIVAL_PHENOTYPES = ['THIN', 'MEDIUM', 'THICK'] as const;

export type PeriodontalGrade = (typeof PERIODONTAL_GRADES)[number];
export type FurcationGrade = (typeof FURCATION_GRADES)[number];
export type MillerClass = (typeof MILLER_CLASSES)[number];
export type CejVisibility = (typeof CEJ_VISIBILITY_VALUES)[number];
export type RootConcavity = (typeof ROOT_CONCAVITY_VALUES)[number];
export type GingivalPhenotype = (typeof GINGIVAL_PHENOTYPES)[number];
export type CairoRecessionType = 'NONE' | 'RT1' | 'RT2' | 'RT3';

export interface PeriodontalSiteMeasurement {
  readonly pd: number;
  readonly gm?: number;
  readonly bop: boolean;
  readonly suppuration: boolean;
}

export interface PeriodontalToothExamination {
  readonly toothNumber: number;
  readonly sites: Partial<Record<PeriodontalSite, PeriodontalSiteMeasurement>>;
  readonly mobility?: PeriodontalGrade;
  readonly furcation: Partial<Record<FurcationEntrance, FurcationGrade>>;
  readonly plaque: readonly IndexSurface[];
  readonly plaqueIndex: Partial<Record<IndexSurface, PeriodontalGrade>>;
  readonly gingivalIndex: Partial<Record<IndexSurface, PeriodontalGrade>>;
  readonly periImplantPlaqueIndex: Partial<
    Record<IndexSurface, PeriodontalGrade>
  >;
  readonly periImplantBleedingIndex: Partial<
    Record<IndexSurface, PeriodontalGrade>
  >;
  readonly keratinizedGingivaWidth?: number;
  readonly cejVisibility?: CejVisibility;
  readonly rootConcavity?: RootConcavity;
  readonly gingivalPhenotype?: GingivalPhenotype;
  readonly millerClass?: MillerClass;
}

export interface PeriodontalRiskContext {
  readonly age?: number;
  readonly smokingStatus?: 'NEVER' | 'FORMER' | 'CURRENT' | 'UNKNOWN';
  readonly cigarettesPerDay?: number;
  readonly diabetesStatus?: 'NONE' | 'PRESENT' | 'UNKNOWN';
  readonly hba1c?: number;
  readonly periodontalToothLoss?: number;
  readonly maximumRadiographicBoneLossPercent?: number;
}

export interface PeriodontalExamination {
  readonly status: 'DRAFT' | 'CONFIRMED';
  readonly enteredByUserId: string;
  readonly verifiedByDentistId: string | null;
  readonly teeth: readonly PeriodontalToothExamination[];
  readonly riskContext: PeriodontalRiskContext;
  readonly updatedAt: Date;
}

export interface PeriodontalSitePatch {
  readonly pd?: number | null;
  readonly gm?: number | null;
  readonly bop?: boolean;
  readonly suppuration?: boolean;
}

export interface PeriodontalSummary {
  readonly chartedSites: number;
  readonly averagePd: number | null;
  readonly maximumPd: number | null;
  readonly averageCal: number | null;
  readonly maximumCal: number | null;
  readonly maximumCalTooth: number | null;
  readonly bopPercent: number;
  readonly suppurationSites: number;
  readonly plaquePercent: number;
  readonly maximumFurcation: FurcationGrade | null;
  readonly averagePlaqueIndex: number | null;
  readonly averageGingivalIndex: number | null;
  readonly averageMpi: number | null;
  readonly averageMbi: number | null;
  readonly keratinizedGingivaDeficientTeeth: number;
  readonly phenotypeCounts: Readonly<Record<GingivalPhenotype, number>>;
}

export interface PeriodontalClassificationResult {
  readonly status: 'NOT_CLINICALLY_APPROVED';
  readonly diagnosis: null;
  readonly stage: null;
  readonly grade: null;
  readonly extent: null;
  readonly reason: string;
}

export const createEmptyPeriodontalExamination = (
  userId: string,
  now = new Date(),
): PeriodontalExamination => ({
  enteredByUserId: userId,
  riskContext: {},
  status: 'DRAFT',
  teeth: [],
  updatedAt: now,
  verifiedByDentistId: null,
});

export const getFurcationEntrances = (
  toothNumber: number,
): readonly FurcationEntrance[] => {
  const quadrant = Math.floor(toothNumber / 10);
  const position = toothNumber % 10;
  if ([1, 2].includes(quadrant) && position >= 6) {
    return ['MESIAL', 'DISTAL', 'BUCCAL'];
  }
  if ([3, 4].includes(quadrant) && position >= 6) {
    return ['BUCCAL', 'LINGUAL'];
  }
  if ([1, 2].includes(quadrant) && position === 4) {
    return ['MESIAL', 'DISTAL'];
  }
  return [];
};

export const getPeriodontalTooth = (
  examination: PeriodontalExamination | null | undefined,
  toothNumber: number,
): PeriodontalToothExamination =>
  examination?.teeth.find(({ toothNumber: candidate }) => candidate === toothNumber) ??
  emptyToothExamination(toothNumber);

export const updatePeriodontalSite = (
  examination: PeriodontalExamination,
  toothNumber: number,
  site: PeriodontalSite,
  patch: PeriodontalSitePatch,
  now = new Date(),
): PeriodontalExamination => {
  if (!PERIODONTAL_SITES.includes(site)) return examination;
  const tooth = getPeriodontalTooth(examination, toothNumber);
  const current = tooth.sites[site];
  if (patch.pd === null || patch.pd === 0) {
    return replaceTooth(examination, toothNumber, {
      ...tooth,
      sites: withoutKey(tooth.sites, site),
    }, now);
  }
  if (patch.pd !== undefined && (!Number.isInteger(patch.pd) || patch.pd < 1 || patch.pd > 15)) {
    return examination;
  }
  if (current === undefined && patch.pd === undefined) return examination;
  const pd = patch.pd ?? current?.pd;
  if (pd === undefined) return examination;
  const gm = patch.gm === null ? undefined : patch.gm ?? current?.gm;
  if (gm !== undefined && (!Number.isInteger(gm) || gm < -10 || gm > 20)) {
    return examination;
  }
  return replaceTooth(examination, toothNumber, {
    ...tooth,
    sites: {
      ...tooth.sites,
      [site]: {
        bop: patch.bop ?? current?.bop ?? false,
        ...(gm === undefined ? {} : { gm }),
        pd,
        suppuration: patch.suppuration ?? current?.suppuration ?? false,
      },
    },
  }, now);
};

export const updatePeriodontalMobility = (
  examination: PeriodontalExamination,
  toothNumber: number,
  grade: PeriodontalGrade | null,
  now = new Date(),
): PeriodontalExamination => {
  const tooth = getPeriodontalTooth(examination, toothNumber);
  const next = grade === null
    ? (() => {
        const { mobility: _mobility, ...withoutMobility } = tooth;
        return withoutMobility;
      })()
    : { ...tooth, mobility: grade };
  return replaceTooth(examination, toothNumber, next, now);
};

export const updateFurcation = (
  examination: PeriodontalExamination,
  toothNumber: number,
  entrance: FurcationEntrance,
  grade: FurcationGrade | null,
  now = new Date(),
): PeriodontalExamination => {
  if (!getFurcationEntrances(toothNumber).includes(entrance)) return examination;
  if (grade !== null && !FURCATION_GRADES.includes(grade)) return examination;
  const tooth = getPeriodontalTooth(examination, toothNumber);
  return replaceTooth(examination, toothNumber, {
    ...tooth,
    furcation:
      grade === null
        ? withoutKey(tooth.furcation, entrance)
        : { ...tooth.furcation, [entrance]: grade },
  }, now);
};

export const updatePlaque = (
  examination: PeriodontalExamination,
  toothNumber: number,
  surface: IndexSurface,
  present: boolean,
  now = new Date(),
): PeriodontalExamination => {
  if (!PERIODONTAL_INDEX_SURFACES.includes(surface)) return examination;
  const tooth = getPeriodontalTooth(examination, toothNumber);
  const plaque = present
    ? [...new Set([...tooth.plaque, surface])]
    : tooth.plaque.filter((candidate) => candidate !== surface);
  return replaceTooth(examination, toothNumber, { ...tooth, plaque }, now);
};

export const updateSurfaceIndex = (
  examination: PeriodontalExamination,
  toothNumber: number,
  index: 'plaqueIndex' | 'gingivalIndex' | 'periImplantPlaqueIndex' | 'periImplantBleedingIndex',
  surface: IndexSurface,
  grade: PeriodontalGrade | 0,
  implantTooth: boolean,
  now = new Date(),
): PeriodontalExamination => {
  if (!PERIODONTAL_INDEX_SURFACES.includes(surface)) return examination;
  if (grade !== 0 && !PERIODONTAL_GRADES.includes(grade)) return examination;
  if (index.startsWith('periImplant') && !implantTooth) return examination;
  const tooth = getPeriodontalTooth(examination, toothNumber);
  const values = tooth[index];
  return replaceTooth(examination, toothNumber, {
    ...tooth,
    [index]: grade === 0 ? withoutKey(values, surface) : { ...values, [surface]: grade },
  }, now);
};

export const updatePeriodontalToothDetail = (
  examination: PeriodontalExamination,
  toothNumber: number,
  detail: Partial<Pick<PeriodontalToothExamination, 'keratinizedGingivaWidth' | 'cejVisibility' | 'rootConcavity' | 'gingivalPhenotype' | 'millerClass'>>,
  now = new Date(),
): PeriodontalExamination => {
  const tooth = getPeriodontalTooth(examination, toothNumber);
  if (
    detail.keratinizedGingivaWidth !== undefined &&
    (!Number.isInteger(detail.keratinizedGingivaWidth) ||
      detail.keratinizedGingivaWidth < 0 ||
      detail.keratinizedGingivaWidth > 15)
  ) {
    return examination;
  }
  return replaceTooth(examination, toothNumber, {
    ...tooth,
    ...detail,
  }, now);
};

export const deriveCal = (
  measurement: PeriodontalSiteMeasurement,
): number => measurement.pd + (measurement.gm ?? 0);

export const deriveCairoRecession = (
  tooth: PeriodontalToothExamination,
): CairoRecessionType => {
  const buccal = tooth.sites.B;
  if (buccal === undefined || (buccal.gm ?? 0) <= 0) return 'NONE';
  const interproximal = Math.max(
    tooth.sites.MB === undefined ? 0 : deriveCal(tooth.sites.MB),
    tooth.sites.DB === undefined ? 0 : deriveCal(tooth.sites.DB),
  );
  const buccalCal = deriveCal(buccal);
  if (interproximal < 1) return 'RT1';
  if (interproximal <= buccalCal) return 'RT2';
  return 'RT3';
};

export const summarizePeriodontalExamination = (
  examination: PeriodontalExamination | null | undefined,
  presentNaturalToothNumbers: readonly number[],
): PeriodontalSummary => {
  const teeth = examination?.teeth ?? [];
  const measurements = teeth.flatMap((tooth) => Object.values(tooth.sites));
  const cals = teeth.flatMap((tooth) => Object.values(tooth.sites).map(deriveCal));
  const bleeding = measurements.filter(({ bop }) => bop).length;
  const plaqueCount = teeth.reduce((total, tooth) => total + tooth.plaque.length, 0);
  const plaqueIndex = Object.values(
    teeth.flatMap((tooth) => Object.values(tooth.plaqueIndex)),
  );
  const gingivalIndex = Object.values(
    teeth.flatMap((tooth) => Object.values(tooth.gingivalIndex)),
  );
  const mpi = Object.values(
    teeth.flatMap((tooth) => Object.values(tooth.periImplantPlaqueIndex)),
  );
  const mbi = Object.values(
    teeth.flatMap((tooth) => Object.values(tooth.periImplantBleedingIndex)),
  );
  const furcation = teeth.flatMap((tooth) => Object.values(tooth.furcation));
  const maximumCal = cals.length === 0 ? null : Math.max(...cals);
  const maximumCalTooth = maximumCal === null
    ? null
    : teeth.find((tooth) => Object.values(tooth.sites).some((site) => deriveCal(site) === maximumCal))?.toothNumber ?? null;
  const phenotypeCounts = { THIN: 0, MEDIUM: 0, THICK: 0 };
  for (const tooth of teeth) {
    if (tooth.gingivalPhenotype) phenotypeCounts[tooth.gingivalPhenotype] += 1;
  }
  return {
    averageCal: average(cals),
    averageGingivalIndex: average(gingivalIndex),
    averageMbi: average(mbi),
    averageMpi: average(mpi),
    averagePd: average(measurements.map(({ pd }) => pd)),
    averagePlaqueIndex: average(plaqueIndex),
    bopPercent: measurements.length === 0 ? 0 : (bleeding / measurements.length) * 100,
    chartedSites: measurements.length,
    keratinizedGingivaDeficientTeeth: teeth.filter(({ keratinizedGingivaWidth }) => keratinizedGingivaWidth !== undefined && keratinizedGingivaWidth < 2).length,
    maximumCal,
    maximumCalTooth,
    maximumFurcation: furcation.length === 0 ? null : Math.max(...furcation) as FurcationGrade,
    maximumPd: measurements.length === 0 ? null : Math.max(...measurements.map(({ pd }) => pd)),
    phenotypeCounts,
    plaquePercent: presentNaturalToothNumbers.length === 0
      ? 0
      : (plaqueCount / (presentNaturalToothNumbers.length * PERIODONTAL_INDEX_SURFACES.length)) * 100,
    suppurationSites: measurements.filter(({ suppuration }) => suppuration).length,
  };
};

export const derivePeriodontalClassification = (): PeriodontalClassificationResult => ({
  diagnosis: null,
  extent: null,
  grade: null,
  reason: '2017 periodontal classification requires explicit clinical approval before release.',
  stage: null,
  status: 'NOT_CLINICALLY_APPROVED',
});

function emptyToothExamination(toothNumber: number): PeriodontalToothExamination {
  return {
    furcation: {},
    gingivalIndex: {},
    periImplantBleedingIndex: {},
    periImplantPlaqueIndex: {},
    plaque: [],
    plaqueIndex: {},
    sites: {},
    toothNumber,
  };
}

function replaceTooth(
  examination: PeriodontalExamination,
  toothNumber: number,
  tooth: PeriodontalToothExamination,
  now: Date,
): PeriodontalExamination {
  const teeth = examination.teeth.some((candidate) => candidate.toothNumber === toothNumber)
    ? examination.teeth.map((candidate) => candidate.toothNumber === toothNumber ? tooth : candidate)
    : [...examination.teeth, tooth].sort((left, right) => left.toothNumber - right.toothNumber);
  return { ...examination, teeth, updatedAt: now };
}

function withoutKey<T>(record: Partial<Record<string, T>>, key: string): Partial<Record<string, T>> {
  const next = { ...record };
  delete next[key];
  return next;
}

function average(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((total, value) => total + value, 0) / values.length;
}
