export const TOOTH_POSITIONS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
  45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

export type ToothPosition = (typeof TOOTH_POSITIONS)[number];
export type ToothNumberingSystem = 'fdi' | 'universal' | 'palmer';
export type ToothDentition = 'permanent' | 'primary';
export type ToothSurface =
  | 'buccal'
  | 'lingual'
  | 'mesial'
  | 'distal'
  | 'occlusal';
export type ToothBase = 'natural' | 'missing' | 'implant';
export type OdontogramAppearance = 'existing' | 'planned';
export type FillingMaterial = 'amalgam' | 'composite' | 'gic' | 'temporary';
export type RestorationType = 'crown' | 'inlay' | 'onlay' | 'veneer';
export type RestorationMaterial =
  | 'emax'
  | 'gold'
  | 'gradia'
  | 'zircon'
  | 'metal'
  | 'metal-ceramic'
  | 'telescope'
  | 'temporary';

export type ToothStructureState =
  | 'under-gum'
  | 'radix'
  | 'broken'
  | 'crown-preparation'
  | 'missing-after-extraction'
  | 'extraction-wound'
  | 'missing-closed'
  | 'crown-needed'
  | 'crown-replacement';
export type ToothFractureRegion = 'mesial' | 'incisal' | 'distal';
export type ImplantProsthesisType =
  | 'healing-abutment'
  | 'locator'
  | 'locator-overdenture'
  | 'bar'
  | 'bar-overdenture'
  | 'removable-partial'
  | 'removable-full';
export type ClinicalVisualConcept =
  | 'fissure-sealing'
  | 'root-caries'
  | 'subcrown-caries'
  | 'filling-defect'
  | 'contact-mesial'
  | 'contact-distal'
  | 'crown-leakage'
  | 'apicoectomy'
  | 'parapulpal-pin'
  | 'pulp-diagnosis'
  | 'apical-diagnosis'
  | 'periapical-lesion'
  | 'root-resorption'
  | 'wear-edge'
  | 'wear-cervical'
  | 'discoloration'
  | 'ortho-appliance'
  | 'ortho-drift'
  | 'ortho-vertical'
  | 'ortho-rotation';

export type OdontogramCondition =
  | {
      readonly kind: 'caries';
      readonly surface: ToothSurface;
      readonly severity?: 1 | 2 | 3 | 4 | 5 | 6;
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'filling';
      readonly surface: ToothSurface;
      readonly material: FillingMaterial;
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'restoration';
      readonly restoration: RestorationType;
      readonly material: RestorationMaterial;
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'endodontic';
      readonly state:
        | 'root-canal'
        | 'medication'
        | 'incomplete'
        | 'glass-fiber-post'
        | 'metal-post';
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'extraction';
      readonly appearance: 'planned';
    }
  | {
      readonly kind: 'bridge';
      readonly bridgeId: string;
      readonly role: 'abutment' | 'pontic';
      readonly material: RestorationMaterial;
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'structure';
      readonly state: ToothStructureState;
      readonly appearance?: OdontogramAppearance;
      readonly fractureRegions?: readonly ToothFractureRegion[];
    }
  | {
      readonly kind: 'planned-implant';
      readonly appearance: 'planned';
    }
  | {
      readonly kind: 'prosthesis';
      readonly groupId: string;
      readonly prosthesis: ImplantProsthesisType;
      readonly appearance: OdontogramAppearance;
    }
  | {
      readonly kind: 'periodontal';
      readonly state: 'calculus' | 'involvement';
      readonly appearance: 'existing';
    }
  | {
      readonly kind: 'peri-implant';
      readonly state: 'mucositis' | 'mild' | 'moderate' | 'severe';
      readonly appearance: 'existing';
    }
  | {
      readonly kind: 'clinical';
      readonly concept: ClinicalVisualConcept;
      readonly subtype?: string;
      readonly surface?: ToothSurface;
      readonly appearance: OdontogramAppearance;
    };

export interface OdontogramTooth {
  readonly position: ToothPosition;
  readonly base: ToothBase;
  readonly dentition?: ToothDentition;
  readonly conditions: readonly OdontogramCondition[];
}

export interface OdontogramData {
  readonly teeth: readonly OdontogramTooth[];
}

export interface OdontogramSelection {
  readonly selectedToothPositions: readonly ToothPosition[];
  readonly activeToothPosition: ToothPosition | null;
}

export type OdontogramDataIssue =
  | { readonly code: 'invalid-shape'; readonly path: string }
  | { readonly code: 'duplicate-position'; readonly position: ToothPosition }
  | { readonly code: 'missing-position'; readonly position: ToothPosition }
  | {
      readonly code: 'invalid-condition';
      readonly position: ToothPosition;
      readonly reason: string;
    };

export type OdontogramDataValidationResult =
  | { readonly valid: true; readonly data: OdontogramData }
  | { readonly valid: false; readonly issues: readonly OdontogramDataIssue[] };

const TOOTH_BASES: readonly ToothBase[] = ['natural', 'missing', 'implant'];
const TOOTH_SURFACES: readonly ToothSurface[] = [
  'buccal',
  'lingual',
  'mesial',
  'distal',
  'occlusal',
];
const ODONTOGRAM_APPEARANCES: readonly OdontogramAppearance[] = [
  'existing',
  'planned',
];
const FILLING_MATERIALS: readonly FillingMaterial[] = [
  'amalgam',
  'composite',
  'gic',
  'temporary',
];
const RESTORATION_TYPES: readonly RestorationType[] = [
  'crown',
  'inlay',
  'onlay',
  'veneer',
];
const RESTORATION_MATERIALS: readonly RestorationMaterial[] = [
  'emax',
  'gold',
  'gradia',
  'zircon',
  'metal',
  'metal-ceramic',
  'telescope',
  'temporary',
];
const PARTIAL_RESTORATION_MATERIALS: ReadonlySet<RestorationMaterial> = new Set(
  ['emax', 'gold', 'gradia', 'zircon', 'temporary'],
);
const CONDITION_KINDS = [
  'caries',
  'filling',
  'restoration',
  'endodontic',
  'extraction',
  'bridge',
  'structure',
  'planned-implant',
  'prosthesis',
  'periodontal',
  'peri-implant',
  'clinical',
] as const;
const BRIDGE_ROLES = ['abutment', 'pontic'] as const;
const ROOT_CANAL_STATES = [
  'root-canal',
  'medication',
  'incomplete',
  'glass-fiber-post',
  'metal-post',
] as const;
const PLANNED_APPEARANCES = ['planned'] as const;
const TOOTH_DENTITIONS = ['permanent', 'primary'] as const;
const TOOTH_STRUCTURE_STATES = [
  'under-gum',
  'radix',
  'broken',
  'crown-preparation',
  'missing-after-extraction',
  'extraction-wound',
  'missing-closed',
  'crown-needed',
  'crown-replacement',
] as const;
const FRACTURE_REGIONS = ['mesial', 'incisal', 'distal'] as const;
const PROSTHESIS_TYPES = [
  'healing-abutment',
  'locator',
  'locator-overdenture',
  'bar',
  'bar-overdenture',
  'removable-partial',
  'removable-full',
] as const;
const PERIODONTAL_STATES = ['calculus', 'involvement'] as const;
const PERI_IMPLANT_STATES = ['mucositis', 'mild', 'moderate', 'severe'] as const;
const CLINICAL_VISUAL_CONCEPTS = [
  'fissure-sealing', 'root-caries', 'subcrown-caries', 'filling-defect',
  'contact-mesial', 'contact-distal', 'crown-leakage', 'apicoectomy',
  'parapulpal-pin', 'pulp-diagnosis', 'apical-diagnosis', 'periapical-lesion',
  'root-resorption', 'wear-edge', 'wear-cervical', 'discoloration',
  'ortho-appliance', 'ortho-drift', 'ortho-vertical', 'ortho-rotation',
] as const;
const TOOTH_POSITION_SET: ReadonlySet<number> = new Set<number>(
  TOOTH_POSITIONS,
);
const TOOTH_POSITION_INDEX: ReadonlyMap<ToothPosition, number> = new Map(
  TOOTH_POSITIONS.map((position, index) => [position, index]),
);
const ANTERIOR_POSITIONS: ReadonlySet<ToothPosition> = new Set([
  13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33,
]);

type UnknownRecord = Record<string, unknown>;
type ConditionKind = (typeof CONDITION_KINDS)[number];
type CariesCondition = Extract<
  OdontogramCondition,
  { readonly kind: 'caries' }
>;
type FillingCondition = Extract<
  OdontogramCondition,
  { readonly kind: 'filling' }
>;
type RestorationCondition = Extract<
  OdontogramCondition,
  { readonly kind: 'restoration' }
>;
type BridgeCondition = Extract<
  OdontogramCondition,
  { readonly kind: 'bridge' }
>;

interface ParsedStructure {
  readonly teeth: readonly OdontogramTooth[];
  readonly issues: readonly OdontogramDataIssue[];
}

interface BridgeUnit {
  readonly position: ToothPosition;
  readonly condition: BridgeCondition;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addInvalidShape(issues: OdontogramDataIssue[], path: string): void {
  issues.push({ code: 'invalid-shape', path });
}

function validateExactKeys(
  value: UnknownRecord,
  allowedKeys: readonly string[],
  path: string,
  issues: OdontogramDataIssue[],
): boolean {
  let valid = true;

  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      addInvalidShape(issues, `${path}.${key}`);
      valid = false;
    }
  }

  return valid;
}

function readEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  path: string,
  issues: OdontogramDataIssue[],
): T | undefined {
  if (
    typeof value !== 'string' ||
    !allowedValues.some((allowedValue) => allowedValue === value)
  ) {
    addInvalidShape(issues, path);
    return undefined;
  }

  return value as T;
}

function readToothPosition(
  value: unknown,
  path: string,
  issues: OdontogramDataIssue[],
): ToothPosition | undefined {
  if (typeof value !== 'number' || !TOOTH_POSITION_SET.has(value)) {
    addInvalidShape(issues, path);
    return undefined;
  }

  return value as ToothPosition;
}

function readCariesSeverity(
  value: unknown,
  path: string,
  issues: OdontogramDataIssue[],
): CariesCondition['severity'] {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 6
  ) {
    addInvalidShape(issues, path);
    return undefined;
  }

  return value as NonNullable<CariesCondition['severity']>;
}

function readBridgeId(
  value: unknown,
  path: string,
  issues: OdontogramDataIssue[],
): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    addInvalidShape(issues, path);
    return undefined;
  }

  return value;
}

function parseCondition(
  value: unknown,
  path: string,
  issues: OdontogramDataIssue[],
): OdontogramCondition | null {
  if (!isRecord(value)) {
    addInvalidShape(issues, path);
    return null;
  }

  const kind = readEnum(value.kind, CONDITION_KINDS, `${path}.kind`, issues);
  if (kind === undefined) {
    return null;
  }

  return parseConditionByKind(kind, value, path, issues);
}

function parseConditionByKind(
  kind: ConditionKind,
  value: UnknownRecord,
  path: string,
  issues: OdontogramDataIssue[],
): OdontogramCondition | null {
  const issueCount = issues.length;

  switch (kind) {
    case 'caries': {
      validateExactKeys(
        value,
        ['kind', 'surface', 'severity', 'appearance'],
        path,
        issues,
      );
      const surface = readEnum(
        value.surface,
        TOOTH_SURFACES,
        `${path}.surface`,
        issues,
      );
      const severity = readCariesSeverity(
        value.severity,
        `${path}.severity`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (
        issues.length !== issueCount ||
        surface === undefined ||
        appearance === undefined
      ) {
        return null;
      }

      return severity === undefined
        ? { kind, surface, appearance }
        : { kind, surface, severity, appearance };
    }

    case 'filling': {
      validateExactKeys(
        value,
        ['kind', 'surface', 'material', 'appearance'],
        path,
        issues,
      );
      const surface = readEnum(
        value.surface,
        TOOTH_SURFACES,
        `${path}.surface`,
        issues,
      );
      const material = readEnum(
        value.material,
        FILLING_MATERIALS,
        `${path}.material`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (
        issues.length !== issueCount ||
        surface === undefined ||
        material === undefined ||
        appearance === undefined
      ) {
        return null;
      }

      return { kind, surface, material, appearance };
    }

    case 'restoration': {
      validateExactKeys(
        value,
        ['kind', 'restoration', 'material', 'appearance'],
        path,
        issues,
      );
      const restoration = readEnum(
        value.restoration,
        RESTORATION_TYPES,
        `${path}.restoration`,
        issues,
      );
      const material = readEnum(
        value.material,
        RESTORATION_MATERIALS,
        `${path}.material`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (
        issues.length !== issueCount ||
        restoration === undefined ||
        material === undefined ||
        appearance === undefined
      ) {
        return null;
      }

      return { kind, restoration, material, appearance };
    }

    case 'endodontic': {
      validateExactKeys(value, ['kind', 'state', 'appearance'], path, issues);
      const state = readEnum(
        value.state,
        ROOT_CANAL_STATES,
        `${path}.state`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (
        issues.length !== issueCount ||
        state === undefined ||
        appearance === undefined
      ) {
        return null;
      }

      return { kind, state, appearance };
    }

    case 'extraction': {
      validateExactKeys(value, ['kind', 'appearance'], path, issues);
      const appearance = readEnum(
        value.appearance,
        PLANNED_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (issues.length !== issueCount || appearance === undefined) {
        return null;
      }

      return { kind, appearance };
    }

    case 'bridge': {
      validateExactKeys(
        value,
        ['kind', 'bridgeId', 'role', 'material', 'appearance'],
        path,
        issues,
      );
      const bridgeId = readBridgeId(value.bridgeId, `${path}.bridgeId`, issues);
      const role = readEnum(value.role, BRIDGE_ROLES, `${path}.role`, issues);
      const material = readEnum(
        value.material,
        RESTORATION_MATERIALS,
        `${path}.material`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );

      if (
        issues.length !== issueCount ||
        bridgeId === undefined ||
        role === undefined ||
        material === undefined ||
        appearance === undefined
      ) {
        return null;
      }

      return { kind, bridgeId, role, material, appearance };
    }

    case 'structure': {
      validateExactKeys(
        value,
        ['kind', 'state', 'appearance', 'fractureRegions'],
        path,
        issues,
      );
      const state = readEnum(
        value.state,
        TOOTH_STRUCTURE_STATES,
        `${path}.state`,
        issues,
      );
      const appearance =
        value.appearance === undefined
          ? undefined
          : readEnum(
              value.appearance,
              ODONTOGRAM_APPEARANCES,
              `${path}.appearance`,
              issues,
            );
      const fractureRegions = readOptionalEnumArray(
        value.fractureRegions,
        FRACTURE_REGIONS,
        `${path}.fractureRegions`,
        issues,
      );

      if (issues.length !== issueCount || state === undefined) return null;
      return fractureRegions === undefined
        ? appearance === undefined
          ? { kind, state }
          : { kind, state, appearance }
        : appearance === undefined
          ? { kind, state, fractureRegions }
          : { kind, state, appearance, fractureRegions };
    }

    case 'planned-implant': {
      validateExactKeys(value, ['kind', 'appearance'], path, issues);
      const appearance = readEnum(
        value.appearance,
        PLANNED_APPEARANCES,
        `${path}.appearance`,
        issues,
      );
      if (issues.length !== issueCount || appearance === undefined) return null;
      return { kind, appearance };
    }

    case 'prosthesis': {
      validateExactKeys(
        value,
        ['kind', 'groupId', 'prosthesis', 'appearance'],
        path,
        issues,
      );
      const groupId = readBridgeId(value.groupId, `${path}.groupId`, issues);
      const prosthesis = readEnum(
        value.prosthesis,
        PROSTHESIS_TYPES,
        `${path}.prosthesis`,
        issues,
      );
      const appearance = readEnum(
        value.appearance,
        ODONTOGRAM_APPEARANCES,
        `${path}.appearance`,
        issues,
      );
      if (
        issues.length !== issueCount ||
        groupId === undefined ||
        prosthesis === undefined ||
        appearance === undefined
      ) {
        return null;
      }
      return { kind, groupId, prosthesis, appearance };
    }

    case 'periodontal': {
      validateExactKeys(value, ['kind', 'state', 'appearance'], path, issues);
      const state = readEnum(value.state, PERIODONTAL_STATES, `${path}.state`, issues);
      const appearance = readEnum(value.appearance, ['existing'] as const, `${path}.appearance`, issues);
      if (issues.length !== issueCount || state === undefined || appearance === undefined) return null;
      return { kind, state, appearance };
    }

    case 'peri-implant': {
      validateExactKeys(value, ['kind', 'state', 'appearance'], path, issues);
      const state = readEnum(value.state, PERI_IMPLANT_STATES, `${path}.state`, issues);
      const appearance = readEnum(value.appearance, ['existing'] as const, `${path}.appearance`, issues);
      if (issues.length !== issueCount || state === undefined || appearance === undefined) return null;
      return { kind, state, appearance };
    }

    case 'clinical': {
      validateExactKeys(value, ['kind', 'concept', 'subtype', 'surface', 'appearance'], path, issues);
      const concept = readEnum(value.concept, CLINICAL_VISUAL_CONCEPTS, `${path}.concept`, issues);
      const surface = value.surface === undefined ? undefined : readEnum(value.surface, TOOTH_SURFACES, `${path}.surface`, issues);
      const appearance = readEnum(value.appearance, ODONTOGRAM_APPEARANCES, `${path}.appearance`, issues);
      if (issues.length !== issueCount || concept === undefined || appearance === undefined) return null;
      return {
        ...(surface === undefined ? {} : { surface }),
        ...(typeof value.subtype === 'string' ? { subtype: value.subtype } : {}),
        appearance,
        concept,
        kind,
      };
    }
  }
}

function readOptionalEnumArray<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  path: string,
  issues: OdontogramDataIssue[],
): readonly T[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    addInvalidShape(issues, path);
    return undefined;
  }
  const values = value.map((entry, index) =>
    readEnum(entry, allowedValues, `${path}[${index}]`, issues),
  );
  return values.every((entry): entry is T => entry !== undefined)
    ? values
    : undefined;
}

function parseTooth(
  value: unknown,
  index: number,
  issues: OdontogramDataIssue[],
  seenPositions: Set<ToothPosition>,
  duplicatePositions: Set<ToothPosition>,
): OdontogramTooth | null {
  const path = `$.teeth[${index}]`;
  if (!isRecord(value)) {
    addInvalidShape(issues, path);
    return null;
  }

  const exactKeys = validateExactKeys(
    value,
    ['position', 'base', 'dentition', 'conditions'],
    path,
    issues,
  );
  const position = readToothPosition(
    value.position,
    `${path}.position`,
    issues,
  );

  if (position !== undefined) {
    if (seenPositions.has(position)) {
      duplicatePositions.add(position);
    } else {
      seenPositions.add(position);
    }
  }

  const base = readEnum(value.base, TOOTH_BASES, `${path}.base`, issues);
  const dentition =
    value.dentition === undefined
      ? undefined
      : readEnum(
          value.dentition,
          TOOTH_DENTITIONS,
          `${path}.dentition`,
          issues,
        );
  const parsedConditions: OdontogramCondition[] = [];
  let conditionsValid = true;

  if (!Array.isArray(value.conditions)) {
    addInvalidShape(issues, `${path}.conditions`);
    conditionsValid = false;
  } else {
    value.conditions.forEach((condition, conditionIndex) => {
      const parsedCondition = parseCondition(
        condition,
        `${path}.conditions[${conditionIndex}]`,
        issues,
      );

      if (parsedCondition === null) {
        conditionsValid = false;
      } else {
        parsedConditions.push(parsedCondition);
      }
    });
  }

  if (
    !exactKeys ||
    position === undefined ||
    base === undefined ||
    (value.dentition !== undefined && dentition === undefined) ||
    !conditionsValid
  ) {
    return null;
  }

  return dentition === undefined
    ? { position, base, conditions: parsedConditions }
    : { position, base, dentition, conditions: parsedConditions };
}

function parseStructure(input: unknown): ParsedStructure {
  const issues: OdontogramDataIssue[] = [];
  const parsedTeeth: OdontogramTooth[] = [];
  const seenPositions = new Set<ToothPosition>();
  const duplicatePositions = new Set<ToothPosition>();

  if (!isRecord(input)) {
    addInvalidShape(issues, '$');
    return { teeth: parsedTeeth, issues };
  }

  validateExactKeys(input, ['teeth'], '$', issues);
  if (!Array.isArray(input.teeth)) {
    addInvalidShape(issues, '$.teeth');
    return { teeth: parsedTeeth, issues };
  }

  input.teeth.forEach((tooth, index) => {
    const parsedTooth = parseTooth(
      tooth,
      index,
      issues,
      seenPositions,
      duplicatePositions,
    );

    if (parsedTooth !== null) {
      parsedTeeth.push(parsedTooth);
    }
  });

  for (const position of TOOTH_POSITIONS) {
    if (duplicatePositions.has(position)) {
      issues.push({ code: 'duplicate-position', position });
    }
  }

  for (const position of TOOTH_POSITIONS) {
    if (!seenPositions.has(position)) {
      issues.push({ code: 'missing-position', position });
    }
  }

  return { teeth: parsedTeeth, issues };
}

function addConditionIssue(
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
  position: ToothPosition,
  reason: string,
): void {
  const key = `${position}:${reason}`;
  if (issueKeys.has(key)) {
    return;
  }

  issueKeys.add(key);
  issues.push({ code: 'invalid-condition', position, reason });
}

function validateSurfaceCardinality(
  conditions: readonly (CariesCondition | FillingCondition)[],
  conditionName: 'caries' | 'filling',
  position: ToothPosition,
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
): void {
  const seenSurfaces = new Set<ToothSurface>();

  for (const condition of conditions) {
    if (seenSurfaces.has(condition.surface)) {
      addConditionIssue(
        issues,
        issueKeys,
        position,
        `${conditionName} may appear only once per surface`,
      );
    }
    seenSurfaces.add(condition.surface);
  }
}

function conditionIsSupportedByBase(
  base: ToothBase,
  condition: OdontogramCondition,
): boolean {
  if (condition.kind === 'structure') return true;
  if (condition.kind === 'planned-implant') {
    return base === 'natural' || base === 'missing';
  }
  if (condition.kind === 'prosthesis') {
    return base === 'implant'
      ? !condition.prosthesis.startsWith('removable-')
      : base === 'missing' && condition.prosthesis.startsWith('removable-');
  }
  if (condition.kind === 'periodontal') return base === 'natural';
  if (condition.kind === 'peri-implant') return base === 'implant';
  if (condition.kind === 'clinical') return base === 'natural' || base === 'implant';
  switch (base) {
    case 'natural':
      return condition.kind !== 'bridge' || condition.role === 'abutment';
    case 'implant':
      return (
        (condition.kind === 'restoration' &&
          condition.restoration === 'crown') ||
        (condition.kind === 'bridge' && condition.role === 'abutment')
      );
    case 'missing':
      return condition.kind === 'bridge' && condition.role === 'pontic';
  }
}

function describeBase(base: ToothBase): string {
  return base === 'implant' ? 'an implant base' : `a ${base} base`;
}

function validateRestorationMaterial(
  restoration: RestorationCondition,
  position: ToothPosition,
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
): void {
  if (
    restoration.restoration !== 'crown' &&
    !PARTIAL_RESTORATION_MATERIALS.has(restoration.material)
  ) {
    addConditionIssue(
      issues,
      issueKeys,
      position,
      `${restoration.material} is not supported for ${restoration.restoration}`,
    );
  }
}

function validateToothConditions(
  tooth: OdontogramTooth,
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
): readonly BridgeUnit[] {
  const caries = tooth.conditions.filter(
    (condition): condition is CariesCondition => condition.kind === 'caries',
  );
  const fillings = tooth.conditions.filter(
    (condition): condition is FillingCondition => condition.kind === 'filling',
  );
  const restorations = tooth.conditions.filter(
    (condition): condition is RestorationCondition =>
      condition.kind === 'restoration',
  );
  const endodontics = tooth.conditions.filter(
    (condition) => condition.kind === 'endodontic',
  );
  const extractions = tooth.conditions.filter(
    (condition) => condition.kind === 'extraction',
  );
  const bridges = tooth.conditions.filter(
    (condition): condition is BridgeCondition => condition.kind === 'bridge',
  );
  const prostheses = tooth.conditions.filter(
    (condition) => condition.kind === 'prosthesis',
  );
  const plannedImplants = tooth.conditions.filter(
    (condition) => condition.kind === 'planned-implant',
  );

  validateSurfaceCardinality(
    caries,
    'caries',
    tooth.position,
    issues,
    issueKeys,
  );
  validateSurfaceCardinality(
    fillings,
    'filling',
    tooth.position,
    issues,
    issueKeys,
  );

  const singletonCounts: readonly [string, readonly OdontogramCondition[]][] = [
    ['restoration', restorations],
    ['endodontic condition', endodontics],
    ['extraction marker', extractions],
    ['bridge membership', bridges],
    ['prosthesis membership', prostheses],
  ];

  for (const [name, conditions] of singletonCounts) {
    if (conditions.length > 1) {
      addConditionIssue(
        issues,
        issueKeys,
        tooth.position,
        `only one ${name} is allowed per tooth`,
      );
    }
  }

  for (const condition of tooth.conditions) {
    if (!conditionIsSupportedByBase(tooth.base, condition)) {
      addConditionIssue(
        issues,
        issueKeys,
        tooth.position,
        `${condition.kind} is not supported on ${describeBase(tooth.base)}`,
      );
    }

    if (
      condition.kind === 'planned-implant' &&
      tooth.base === 'implant'
    ) {
      addConditionIssue(
        issues,
        issueKeys,
        tooth.position,
        'a planned implant cannot coexist with an existing implant base',
      );
    }

    if (
      ANTERIOR_POSITIONS.has(tooth.position) &&
      (condition.kind === 'caries' || condition.kind === 'filling') &&
      condition.surface === 'lingual'
    ) {
      addConditionIssue(
        issues,
        issueKeys,
        tooth.position,
        'lingual surface conditions are not renderable for anterior positions',
      );
    }

    if (
      ANTERIOR_POSITIONS.has(tooth.position) &&
      condition.kind === 'restoration' &&
      condition.restoration === 'onlay'
    ) {
      addConditionIssue(
        issues,
        issueKeys,
        tooth.position,
        'onlay is not renderable for anterior positions',
      );
    }
  }

  restorations.forEach((restoration) =>
    validateRestorationMaterial(restoration, tooth.position, issues, issueKeys),
  );

  if (restorations.length > 0 && caries.length + fillings.length > 0) {
    addConditionIssue(
      issues,
      issueKeys,
      tooth.position,
      'surface conditions cannot be combined with a fixed restoration',
    );
  }

  if (bridges.length > 0 && caries.length + fillings.length > 0) {
    addConditionIssue(
      issues,
      issueKeys,
      tooth.position,
      'surface conditions cannot be combined with bridge membership',
    );
  }

  if (restorations.length > 0 && bridges.length > 0) {
    addConditionIssue(
      issues,
      issueKeys,
      tooth.position,
      'a standalone restoration cannot be combined with bridge membership',
    );
  }

  if (prostheses.length > 0 && (restorations.length > 0 || bridges.length > 0)) {
    addConditionIssue(
      issues,
      issueKeys,
      tooth.position,
      'a prosthesis cannot be combined with fixed restoration or bridge membership',
    );
  }

  if (plannedImplants.length > 0 && (restorations.length > 0 || bridges.length > 0)) {
    addConditionIssue(
      issues,
      issueKeys,
      tooth.position,
      'a planned implant cannot be combined with fixed restoration or bridge membership',
    );
  }

  return bridges.length === 1
    ? [{ position: tooth.position, condition: bridges[0] }]
    : [];
}

function addBridgeGroupIssue(
  units: readonly BridgeUnit[],
  reason: string,
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
): void {
  for (const unit of units) {
    addConditionIssue(issues, issueKeys, unit.position, reason);
  }
}

function toothPositionIndex(position: ToothPosition): number {
  const index = TOOTH_POSITION_INDEX.get(position);
  if (index === undefined) {
    throw new Error(`Unknown tooth position: ${position}`);
  }
  return index;
}

function validateBridgeGroup(
  units: readonly BridgeUnit[],
  issues: OdontogramDataIssue[],
  issueKeys: Set<string>,
): void {
  const orderedUnits = [...units].sort(
    (left, right) =>
      toothPositionIndex(left.position) - toothPositionIndex(right.position),
  );

  if (orderedUnits.length < 2) {
    addBridgeGroupIssue(
      orderedUnits,
      'a bridge group must contain at least two units',
      issues,
      issueKeys,
    );
  }

  const positionIndexes = orderedUnits.map((unit) =>
    toothPositionIndex(unit.position),
  );
  const arches = new Set(
    positionIndexes.map((index) => (index < 16 ? 'upper' : 'lower')),
  );

  if (arches.size > 1) {
    addBridgeGroupIssue(
      orderedUnits,
      'a bridge group must stay within one arch',
      issues,
      issueKeys,
    );
  } else if (
    positionIndexes.some(
      (positionIndex, index) =>
        index > 0 && positionIndex !== positionIndexes[index - 1] + 1,
    )
  ) {
    addBridgeGroupIssue(
      orderedUnits,
      'a bridge group must occupy contiguous chart positions',
      issues,
      issueKeys,
    );
  }

  if (new Set(orderedUnits.map((unit) => unit.condition.material)).size > 1) {
    addBridgeGroupIssue(
      orderedUnits,
      'a bridge group must use one material',
      issues,
      issueKeys,
    );
  }

  if (new Set(orderedUnits.map((unit) => unit.condition.appearance)).size > 1) {
    addBridgeGroupIssue(
      orderedUnits,
      'a bridge group must use one appearance',
      issues,
      issueKeys,
    );
  }
}

function validateVisualInvariants(
  teeth: readonly OdontogramTooth[],
): readonly OdontogramDataIssue[] {
  const issues: OdontogramDataIssue[] = [];
  const issueKeys = new Set<string>();
  const bridgeGroups = new Map<string, BridgeUnit[]>();
  const orderedTeeth = [...teeth].sort(
    (left, right) =>
      toothPositionIndex(left.position) - toothPositionIndex(right.position),
  );

  for (const tooth of orderedTeeth) {
    for (const bridgeUnit of validateToothConditions(
      tooth,
      issues,
      issueKeys,
    )) {
      const group = bridgeGroups.get(bridgeUnit.condition.bridgeId) ?? [];
      group.push(bridgeUnit);
      bridgeGroups.set(bridgeUnit.condition.bridgeId, group);
    }
  }

  const orderedGroups = [...bridgeGroups.values()].sort(
    (left, right) =>
      toothPositionIndex(left[0].position) -
      toothPositionIndex(right[0].position),
  );

  for (const group of orderedGroups) {
    validateBridgeGroup(group, issues, issueKeys);
  }

  return issues;
}

function validateOdontogramDataSafely(
  input: unknown,
): OdontogramDataValidationResult {
  const structure = parseStructure(input);
  if (structure.issues.length > 0) {
    return { valid: false, issues: structure.issues };
  }

  const visualIssues = validateVisualInvariants(structure.teeth);
  if (visualIssues.length > 0) {
    return { valid: false, issues: visualIssues };
  }

  return { valid: true, data: input as OdontogramData };
}

/**
 * Validates the renderer-facing chart contract without applying Treatment
 * workflow or clinical eligibility rules.
 */
export function validateOdontogramData(
  input: unknown,
): OdontogramDataValidationResult {
  try {
    return validateOdontogramDataSafely(input);
  } catch {
    return {
      valid: false,
      issues: [{ code: 'invalid-shape', path: '$' }],
    };
  }
}
