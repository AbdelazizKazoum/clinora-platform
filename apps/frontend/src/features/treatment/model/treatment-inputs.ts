import {
  CLINICAL_FINDING_CODES,
  TREATMENT_ACT_CODES,
  type ClinicalDetail,
  type ClinicalFindingCode,
  type ClinicalTarget,
  type FurcationEntrance,
  type IndexSurface,
  type PeriodontalSite,
  type ToothSurface,
  type TreatmentActCode,
  type TypedTreatmentTarget,
} from './treatment';
import {
  getClinicalFindingOption,
  getTreatmentActOption,
  type TreatmentCatalogueTarget,
} from './treatment-catalogue';

export type TypedClinicalDetail = ClinicalDetail;

type DetailValueByKey = {
  readonly TOOTH_STATE: 'NATURAL' | 'MISSING' | 'IMPLANT' | 'PRIMARY' | 'UNDER_GUM' | 'MISSING_AFTER_EXTRACTION';
  readonly TOOTH_SUBSTRATE: 'NATURAL' | 'RADIX' | 'BROKEN' | 'CROWNPREP';
  readonly ICDAS_CARS_SEVERITY: number;
  readonly FILLING_MATERIAL: 'AMALGAM' | 'COMPOSITE' | 'GIC' | 'TEMPORARY';
  readonly RESTORATION_TYPE: 'CROWN' | 'INLAY' | 'ONLAY' | 'VENEER' | 'BRIDGE';
  readonly RESTORATION_MATERIAL: 'EMAX' | 'GOLD' | 'GRADIA' | 'METAL' | 'METAL_CERAMIC' | 'TELESCOPE' | 'TEMPORARY' | 'ZIRCON';
  readonly ENDODONTIC_STATE: 'MEDICATION' | 'ROOT_CANAL_FILLING' | 'INCOMPLETE' | 'GLASS_FIBER_POST' | 'METAL_POST';
  readonly PROSTHESIS_TYPE: 'HEALING_ABUTMENT' | 'LOCATOR' | 'LOCATOR_DENTURE' | 'BAR' | 'BAR_DENTURE' | 'REMOVABLE_PARTIAL' | 'REMOVABLE_FULL';
  readonly MOBILITY_GRADE: '1' | '2' | '3';
  readonly ROOT_CARIES_STATE: 'ACTIVE' | 'ARRESTED' | 'ACTIVE_CAVITATED';
  readonly PERIAPICAL_LESION_TYPE: 'GRANULOMA' | 'CYST' | 'ABSCESS';
  readonly PULP_DIAGNOSIS: 'NORMAL' | 'REVERSIBLE_PULPITIS' | 'IRREVERSIBLE_PULPITIS' | 'NECROSIS';
  readonly APICAL_DIAGNOSIS: 'NORMAL' | 'SYMPTOMATIC_APICAL_PERIODONTITIS' | 'ASYMPTOMATIC_APICAL_PERIODONTITIS' | 'ACUTE_APICAL_ABSCESS' | 'CHRONIC_APICAL_ABSCESS' | 'CONDENSING_OSTEITIS';
  readonly ROOT_RESORPTION_TYPE: 'INTERNAL' | 'EXTERNAL_CERVICAL';
  readonly WEAR_TYPE: 'ATTRITION' | 'ABRASION' | 'ABFRACTION' | 'EROSION';
  readonly WEAR_EDGE_TYPE: 'ATTRITION' | 'EROSION';
  readonly WEAR_CERVICAL_TYPE: 'ABRASION' | 'ABFRACTION' | 'EROSION';
  readonly DISCOLORATION_TYPE: 'TETRACYCLINE' | 'FLUOROSIS' | 'NONVITAL' | 'EXTRINSIC' | 'OTHER';
  readonly ORTHODONTIC_APPLIANCE: 'BRACKET' | 'BAND';
  readonly ORTHODONTIC_DRIFT: 'MESIAL_DRIFT' | 'DISTAL_DRIFT';
  readonly ORTHODONTIC_VERTICAL: 'EXTRUSION' | 'INTRUSION';
  readonly ORTHODONTIC_STATE: 'BRACKET' | 'BAND' | 'MESIAL_DRIFT' | 'DISTAL_DRIFT' | 'EXTRUSION' | 'INTRUSION' | 'ROTATION';
  readonly PERI_IMPLANT_STATE: 'HEALTHY' | 'MUCOSITIS' | 'MILD' | 'MODERATE' | 'SEVERE';
  readonly PROBING_DEPTH_MM: number;
  readonly GINGIVAL_MARGIN_MM: number;
  readonly BOP: boolean;
  readonly SUPPURATION: boolean;
  readonly FURCATION_GRADE: '1' | '2' | '3' | '4';
  readonly PLAQUE_PRESENT: boolean;
  readonly GINGIVAL_INDEX: '0' | '1' | '2' | '3';
};

export type TypedDetail<K extends keyof DetailValueByKey> = {
  readonly key: K;
  readonly value: DetailValueByKey[K];
};

type FindingDetailKeys = {
  readonly TOOTH_STATE: keyof Pick<DetailValueByKey, 'TOOTH_STATE'>;
  readonly TOOTH_SUBSTRATE: keyof Pick<DetailValueByKey, 'TOOTH_SUBSTRATE'>;
  readonly CARIES: keyof Pick<DetailValueByKey, 'ICDAS_CARS_SEVERITY'>;
  readonly ROOT_CARIES: keyof Pick<DetailValueByKey, 'ROOT_CARIES_STATE'>;
  readonly EXISTING_FILLING: keyof Pick<DetailValueByKey, 'FILLING_MATERIAL'>;
  readonly EXISTING_FIXED_RESTORATION: keyof Pick<DetailValueByKey, 'RESTORATION_TYPE' | 'RESTORATION_MATERIAL'>;
  readonly EXISTING_ENDODONTIC_STATE: keyof Pick<DetailValueByKey, 'ENDODONTIC_STATE'>;
  readonly EXISTING_PROSTHESIS: keyof Pick<DetailValueByKey, 'PROSTHESIS_TYPE'>;
  readonly MOBILITY: keyof Pick<DetailValueByKey, 'MOBILITY_GRADE'>;
  readonly PERIAPICAL_LESION: keyof Pick<DetailValueByKey, 'PERIAPICAL_LESION_TYPE'>;
  readonly PULP_DIAGNOSIS: keyof Pick<DetailValueByKey, 'PULP_DIAGNOSIS'>;
  readonly APICAL_DIAGNOSIS: keyof Pick<DetailValueByKey, 'APICAL_DIAGNOSIS'>;
  readonly ROOT_RESORPTION: keyof Pick<DetailValueByKey, 'ROOT_RESORPTION_TYPE'>;
  readonly TOOTH_WEAR: keyof Pick<DetailValueByKey, 'WEAR_TYPE'>;
  readonly DISCOLORATION: keyof Pick<DetailValueByKey, 'DISCOLORATION_TYPE'>;
  readonly ORTHODONTIC_STATE: keyof Pick<DetailValueByKey, 'ORTHODONTIC_STATE'>;
  readonly PERI_IMPLANT_STATUS: keyof Pick<DetailValueByKey, 'PERI_IMPLANT_STATE'>;
  readonly PERIODONTAL_MEASUREMENT: keyof Pick<DetailValueByKey, 'PROBING_DEPTH_MM' | 'GINGIVAL_MARGIN_MM' | 'BOP' | 'SUPPURATION'>;
  readonly FURCATION_INVOLVEMENT: keyof Pick<DetailValueByKey, 'FURCATION_GRADE'>;
  readonly PLAQUE_FINDING: keyof Pick<DetailValueByKey, 'PLAQUE_PRESENT'>;
  readonly GINGIVAL_FINDING: keyof Pick<DetailValueByKey, 'GINGIVAL_INDEX'>;
};

type ActDetailKeys = {
  readonly DIRECT_FILLING: keyof Pick<DetailValueByKey, 'FILLING_MATERIAL'>;
  readonly CROWN: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
  readonly INLAY: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
  readonly ONLAY: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
  readonly VENEER: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
  readonly BRIDGE: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
  readonly CROWN_REPLACEMENT: keyof Pick<DetailValueByKey, 'RESTORATION_MATERIAL'>;
};

type DetailKeysFor<T extends string, M extends Record<string, keyof DetailValueByKey>> =
  T extends keyof M ? M[T] : never;

type TypedInputBase = {
  readonly id: string;
  readonly target: TypedTreatmentTarget;
  readonly note?: string | null;
};

export type TypedClinicalFindingInput = {
  [C in ClinicalFindingCode]: TypedInputBase & {
    readonly code: C;
    readonly details: readonly TypedDetail<
      DetailKeysFor<C, FindingDetailKeys>
    >[];
  };
}[ClinicalFindingCode];

export type TypedTreatmentActInput = {
  [C in TreatmentActCode]: TypedInputBase & {
    readonly code: C;
    readonly details: readonly TypedDetail<DetailKeysFor<C, ActDetailKeys>>[];
  };
}[TreatmentActCode];

export interface TreatmentInputDraft {
  readonly id: string;
  readonly code: ClinicalFindingCode | TreatmentActCode;
  readonly target: ClinicalTarget;
  readonly details?: readonly ClinicalDetail[];
  readonly note?: string | null;
}

const VALID_CODES = new Set<string>([
  ...CLINICAL_FINDING_CODES,
  ...TREATMENT_ACT_CODES,
]);

const expectedTargetFor = (
  code: ClinicalFindingCode | TreatmentActCode,
): TreatmentCatalogueTarget =>
  getClinicalFindingOption(code as ClinicalFindingCode)?.target ??
  getTreatmentActOption(code as TreatmentActCode)?.target ??
  'tooth';

const targetKindFor = (target: TreatmentCatalogueTarget): string =>
  ({
    arch: 'ARCH',
    bridge: 'BRIDGE_SPAN',
    'furcation': 'FURCATION_ENTRANCE',
    'index-surface': 'INDEX_SURFACE',
    periodontal: 'PERIODONTAL_SITE',
    surface: 'TOOTH_SURFACE',
    tooth: 'TOOTH',
    'tooth-region': 'TOOTH_REGION',
  })[target];

const isNonEmptyArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value) && value.length > 0;

const assertTarget = (
  code: ClinicalFindingCode | TreatmentActCode,
  target: ClinicalTarget,
): void => {
  const expectedKind = targetKindFor(expectedTargetFor(code));
  if (target.kind !== expectedKind) {
    throw new Error(
      `${code} requires a ${expectedKind} target, received ${target.kind}.`,
    );
  }
  if (!isNonEmptyArray(target.toothNumbers)) {
    throw new Error(`${code} requires at least one tooth number.`);
  }
  if (
    (target.kind === 'TOOTH_SURFACE' || target.kind === 'TOOTH_REGION') &&
    !isNonEmptyArray(target.surfaces)
  ) {
    throw new Error(`${code} requires at least one restorative surface.`);
  }
  if (target.kind === 'INDEX_SURFACE' && !isNonEmptyArray(target.surfaces)) {
    throw new Error(`${code} requires at least one index surface.`);
  }
  if (
    target.kind === 'PERIODONTAL_SITE' &&
    !isNonEmptyArray(target.periodontalSites)
  ) {
    throw new Error(`${code} requires at least one periodontal site.`);
  }
  if (
    target.kind === 'FURCATION_ENTRANCE' &&
    !isNonEmptyArray(target.periodontalSites)
  ) {
    throw new Error(`${code} requires at least one furcation entrance.`);
  }
  if (target.kind === 'BRIDGE_SPAN' && target.toothNumbers.length < 2) {
    throw new Error(`${code} requires at least two teeth in the bridge span.`);
  }
  if (target.kind === 'ARCH' && target.arch === null) {
    throw new Error(`${code} requires an upper or lower arch.`);
  }
};

const assertDetails = (
  code: ClinicalFindingCode | TreatmentActCode,
  details: readonly ClinicalDetail[],
): void => {
  const enumValues: Readonly<Record<string, readonly string[]>> = {
    FILLING_MATERIAL: ['AMALGAM', 'COMPOSITE', 'GIC', 'TEMPORARY'],
    RESTORATION_MATERIAL: [
      'EMAX',
      'GOLD',
      'GRADIA',
      'METAL',
      'METAL_CERAMIC',
      'TELESCOPE',
      'TEMPORARY',
      'ZIRCON',
    ],
  };
  const knownKeys = new Set<string>([
    'TOOTH_STATE',
    'TOOTH_SUBSTRATE',
    'ICDAS_CARS_SEVERITY',
    'FILLING_MATERIAL',
    'RESTORATION_TYPE',
    'RESTORATION_MATERIAL',
    'ENDODONTIC_STATE',
    'PROSTHESIS_TYPE',
    'MOBILITY_GRADE',
    'ROOT_CARIES_STATE',
    'PERIAPICAL_LESION_TYPE',
    'PULP_DIAGNOSIS',
    'APICAL_DIAGNOSIS',
    'ROOT_RESORPTION_TYPE',
    'WEAR_TYPE',
    'WEAR_EDGE_TYPE',
    'WEAR_CERVICAL_TYPE',
    'DISCOLORATION_TYPE',
    'ORTHODONTIC_APPLIANCE',
    'ORTHODONTIC_DRIFT',
    'ORTHODONTIC_VERTICAL',
    'ORTHODONTIC_STATE',
    'PERI_IMPLANT_STATE',
    'PROBING_DEPTH_MM',
    'GINGIVAL_MARGIN_MM',
    'BOP',
    'SUPPURATION',
    'FURCATION_GRADE',
    'PLAQUE_PRESENT',
    'GINGIVAL_INDEX',
  ]);
  const findingOption = CLINICAL_FINDING_CODES.includes(
    code as ClinicalFindingCode,
  )
    ? getClinicalFindingOption(code as ClinicalFindingCode)
    : undefined;
  const actOption = TREATMENT_ACT_CODES.includes(code as TreatmentActCode)
    ? getTreatmentActOption(code as TreatmentActCode)
    : undefined;
  const allowedKeys = new Set<string>([
    ...(findingOption?.detailKey ? [findingOption.detailKey] : []),
    ...(findingOption?.numericDetail
      ? [findingOption.numericDetail.key]
      : []),
    ...(actOption?.requiresMaterial === 'filling'
      ? ['FILLING_MATERIAL']
      : []),
    ...(actOption?.requiresMaterial === 'restoration'
      ? ['RESTORATION_MATERIAL']
      : []),
    ...(code === 'EXISTING_FIXED_RESTORATION'
      ? ['RESTORATION_MATERIAL']
      : []),
  ]);
  const requiredKeys = new Set<string>([
    ...(findingOption?.detailKey ? [findingOption.detailKey] : []),
    ...(findingOption?.numericDetail
      ? [findingOption.numericDetail.key]
      : []),
    ...(actOption?.requiresMaterial === 'filling'
      ? ['FILLING_MATERIAL']
      : []),
    ...(actOption?.requiresMaterial === 'restoration'
      ? ['RESTORATION_MATERIAL']
      : []),
    ...(code === 'EXISTING_FIXED_RESTORATION'
      ? ['RESTORATION_TYPE', 'RESTORATION_MATERIAL']
      : []),
  ]);
  const suppliedKeys = new Set(details.map(({ key }) => key));
  for (const key of requiredKeys) {
    if (!suppliedKeys.has(key)) {
      throw new Error(`${code} requires detail key ${key}.`);
    }
  }

  for (const detail of details) {
    if (!knownKeys.has(detail.key)) {
      throw new Error(`${code} does not accept detail key ${detail.key}.`);
    }
    if (!allowedKeys.has(detail.key)) {
      throw new Error(`${code} does not accept detail key ${detail.key}.`);
    }
    const allowedValues = enumValues[detail.key];
    if (
      allowedValues &&
      (typeof detail.value !== 'string' ||
        !allowedValues.includes(detail.value))
    ) {
      throw new Error(`${code} detail ${detail.key} has an invalid value.`);
    }
    if (
      detail.key === findingOption?.detailKey &&
      findingOption.detailOptions &&
      (typeof detail.value !== 'string' ||
        !findingOption.detailOptions.some(
          ({ value }) => value === detail.value,
        ))
    ) {
      throw new Error(`${code} detail ${detail.key} must be a known option.`);
    }
    if (
      typeof detail.value !== 'string' &&
      typeof detail.value !== 'number' &&
      typeof detail.value !== 'boolean'
    ) {
      throw new Error(`${code} detail ${detail.key} has an invalid value.`);
    }
    if (
      (detail.key === 'ICDAS_CARS_SEVERITY' ||
        detail.key === 'PROBING_DEPTH_MM' ||
        detail.key === 'GINGIVAL_MARGIN_MM') &&
      (typeof detail.value !== 'number' || !Number.isFinite(detail.value))
    ) {
      throw new Error(`${code} detail ${detail.key} must be numeric.`);
    }
    const numericRule = findingOption?.numericDetail;
    if (
      numericRule &&
      detail.key === numericRule.key &&
      (typeof detail.value !== 'number' ||
        detail.value < numericRule.min ||
        detail.value > numericRule.max)
    ) {
      throw new Error(
        `${code} detail ${detail.key} must be between ${numericRule.min} and ${numericRule.max}.`,
      );
    }
  }
};

const parseInput = (input: TreatmentInputDraft): TreatmentInputDraft => {
  if (!VALID_CODES.has(input.code)) {
    throw new Error(`Unsupported Treatment input code: ${input.code}.`);
  }
  if (!input.id.trim()) throw new Error('Treatment input requires an id.');
  assertTarget(input.code, input.target);
  assertDetails(input.code, input.details ?? []);
  return { ...input, details: input.details ?? [] };
};

/** Runtime boundary used by mock/UI writers. It does not inspect visual support. */
export const validateTreatmentInput = (input: TreatmentInputDraft): TreatmentInputDraft =>
  parseInput(input);

export const createTreatmentFindingInput = (
  input: TreatmentInputDraft & { readonly code: ClinicalFindingCode },
): TypedClinicalFindingInput => validateTreatmentInput(input) as TypedClinicalFindingInput;

export const createTreatmentActInput = (
  input: TreatmentInputDraft & { readonly code: TreatmentActCode },
): TypedTreatmentActInput => validateTreatmentInput(input) as TypedTreatmentActInput;

export const RESTORATIVE_SURFACES: readonly ToothSurface[] = [
  'BUCCAL',
  'LINGUAL',
  'MESIAL',
  'DISTAL',
  'OCCLUSAL',
];

export const INDEX_SURFACES: readonly IndexSurface[] = [
  'BUCCAL',
  'LINGUAL',
  'MESIAL',
  'DISTAL',
];

export const PERIODONTAL_SITES: readonly PeriodontalSite[] = [
  'MB',
  'B',
  'DB',
  'ML',
  'L',
  'DL',
];

export const FURCATION_ENTRANCES: readonly FurcationEntrance[] = [
  'MESIAL',
  'DISTAL',
  'BUCCAL',
  'LINGUAL',
];
