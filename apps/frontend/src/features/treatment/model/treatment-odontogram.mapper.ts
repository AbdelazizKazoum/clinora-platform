import {
  TOOTH_POSITIONS,
  type FillingMaterial,
  type OdontogramAppearance,
  type OdontogramCondition,
  type OdontogramData,
  type RestorationMaterial,
  type RestorationType,
  type ToothBase,
  type ToothPosition,
  type ToothSurface as OdontogramSurface,
} from '@/features/odontogram';

import type {
  ClinicalDetail,
  ClinicalFinding,
  ToothSurface,
  TreatmentAct,
  TreatmentVisit,
} from './treatment';

export interface TreatmentOdontogramProjectionIssue {
  readonly recordId: string;
  readonly reason: string;
}

export interface TreatmentOdontogramProjection {
  readonly data: OdontogramData;
  readonly issues: readonly TreatmentOdontogramProjectionIssue[];
}

const SURFACES: Record<ToothSurface, OdontogramSurface> = {
  BUCCAL: 'buccal',
  DISTAL: 'distal',
  LINGUAL: 'lingual',
  MESIAL: 'mesial',
  OCCLUSAL: 'occlusal',
};

const FILLING_MATERIALS: Record<string, FillingMaterial> = {
  AMALGAM: 'amalgam',
  COMPOSITE: 'composite',
  GIC: 'gic',
  TEMPORARY: 'temporary',
};

const RESTORATION_MATERIALS: Record<string, RestorationMaterial> = {
  EMAX: 'emax',
  GOLD: 'gold',
  GRADIA: 'gradia',
  METAL: 'metal',
  METAL_CERAMIC: 'metal-ceramic',
  TELESCOPE: 'telescope',
  TEMPORARY: 'temporary',
  ZIRCON: 'zircon',
};

const RESTORATION_TYPES: Record<string, RestorationType> = {
  CROWN: 'crown',
  INLAY: 'inlay',
  ONLAY: 'onlay',
  VENEER: 'veneer',
};

const PARTIAL_RESTORATION_MATERIALS: ReadonlySet<RestorationMaterial> = new Set(
  ['emax', 'gold', 'gradia', 'temporary', 'zircon'],
);

const ANTERIOR_POSITIONS: ReadonlySet<ToothPosition> = new Set([
  13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33,
]);

type MutableTooth = {
  position: ToothPosition;
  base: ToothBase;
  conditions: OdontogramCondition[];
};

export const mapTreatmentVisitToOdontogram = (
  visit: TreatmentVisit,
): TreatmentOdontogramProjection => {
  const teeth = new Map<ToothPosition, MutableTooth>(
    TOOTH_POSITIONS.map((position) => [
      position,
      { base: 'natural', conditions: [], position },
    ]),
  );
  const issues: TreatmentOdontogramProjectionIssue[] = [];

  // Structural tooth state is projected first so the result is independent of
  // record ordering in a future API response.
  for (const finding of visit.findings) {
    if (finding.status !== 'CONFIRMED' || finding.code !== 'TOOTH_STATE')
      continue;
    projectFinding(finding, teeth, issues);
  }

  for (const finding of visit.findings) {
    if (finding.status !== 'CONFIRMED') continue;
    if (finding.code === 'TOOTH_STATE') continue;
    projectFinding(finding, teeth, issues);
  }

  for (const act of visit.acts) {
    if (
      act.status === 'DRAFT' ||
      act.status === 'CANCELLED' ||
      act.status === 'ENTERED_IN_ERROR'
    ) {
      continue;
    }
    projectAct(act, teeth, issues);
  }

  return {
    data: {
      teeth: TOOTH_POSITIONS.map((position) =>
        getProjectionTooth(teeth, position),
      ),
    },
    issues,
  };
};

const projectFinding = (
  finding: ClinicalFinding,
  teeth: Map<ToothPosition, MutableTooth>,
  issues: TreatmentOdontogramProjectionIssue[],
): void => {
  const targets = getTargetTeeth(
    finding.target.toothNumbers,
    finding.id,
    issues,
  );
  if (targets.length === 0) return;

  if (finding.code === 'TOOTH_STATE') {
    const state = detailString(finding.details, 'TOOTH_STATE');
    const base: ToothBase | undefined =
      state === 'MISSING'
        ? 'missing'
        : state === 'IMPLANT'
          ? 'implant'
          : state === 'NATURAL'
            ? 'natural'
            : undefined;
    if (!base) return addIssue(issues, finding.id, 'Unsupported tooth state.');
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      tooth.base = base;
      if (base === 'missing') tooth.conditions = [];
    }
    return;
  }

  if (finding.code === 'CARIES') {
    const severity = detailNumber(finding.details, 'ICDAS_CARS_SEVERITY');
    const mappedSeverity =
      severity && severity >= 1 && severity <= 6
        ? (severity as 1 | 2 | 3 | 4 | 5 | 6)
        : undefined;
    addSurfaceConditions(finding, targets, teeth, issues, (surface) => ({
      appearance: 'existing',
      kind: 'caries',
      severity: mappedSeverity,
      surface,
    }));
    return;
  }

  if (finding.code === 'EXISTING_FILLING') {
    const material =
      FILLING_MATERIALS[
        detailString(finding.details, 'FILLING_MATERIAL') ?? ''
      ];
    if (!material)
      return addIssue(
        issues,
        finding.id,
        'A supported filling material is required.',
      );
    addSurfaceConditions(finding, targets, teeth, issues, (surface) => ({
      appearance: 'existing',
      kind: 'filling',
      material,
      surface,
    }));
    return;
  }

  if (finding.code === 'EXISTING_FIXED_RESTORATION') {
    const restoration =
      RESTORATION_TYPES[
        detailString(finding.details, 'RESTORATION_TYPE') ?? ''
      ];
    const material = restorationMaterial(finding.details);
    if (!restoration || !material) {
      return addIssue(
        issues,
        finding.id,
        'Restoration type and material are required for visualization.',
      );
    }
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      const incompatibility = wholeRestorationIncompatibility(
        tooth,
        position,
        restoration,
        material,
      );
      if (incompatibility) {
        addIssue(issues, finding.id, incompatibility);
        continue;
      }
      replaceWithWholeRestoration(tooth, {
        appearance: 'existing',
        kind: 'restoration',
        material,
        restoration,
      });
    }
    return;
  }

  if (
    finding.code === 'EXISTING_ENDODONTIC_STATE' &&
    detailString(finding.details, 'ENDODONTIC_STATE') === 'ROOT_CANAL_FILLING'
  ) {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural') {
        addIssue(
          issues,
          finding.id,
          `Root-canal state skipped on tooth ${position} because it is ${tooth.base}.`,
        );
        continue;
      }
      addUniqueCondition(tooth, {
        appearance: 'existing',
        kind: 'endodontic',
        state: 'root-canal',
      });
    }
    return;
  }

  addIssue(
    issues,
    finding.id,
    'This clinical detail is recorded but not visualized in the current odontogram.',
  );
};

const projectAct = (
  act: TreatmentAct,
  teeth: Map<ToothPosition, MutableTooth>,
  issues: TreatmentOdontogramProjectionIssue[],
): void => {
  const targets = getTargetTeeth(act.target.toothNumbers, act.id, issues);
  if (targets.length === 0) return;
  const appearance: OdontogramAppearance =
    act.status === 'COMPLETED' ? 'existing' : 'planned';

  if (act.code === 'DIRECT_FILLING') {
    const material =
      FILLING_MATERIALS[detailString(act.details, 'FILLING_MATERIAL') ?? ''];
    if (!material)
      return addIssue(
        issues,
        act.id,
        'A supported filling material is required.',
      );
    addSurfaceConditions(act, targets, teeth, issues, (surface) => ({
      appearance,
      kind: 'filling',
      material,
      surface,
    }));
    return;
  }

  if (['CROWN', 'INLAY', 'ONLAY', 'VENEER'].includes(act.code)) {
    const restoration = RESTORATION_TYPES[act.code];
    const material = restorationMaterial(act.details);
    if (!restoration || !material)
      return addIssue(
        issues,
        act.id,
        'A supported restoration material is required.',
      );
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      const incompatibility = wholeRestorationIncompatibility(
        tooth,
        position,
        restoration,
        material,
      );
      if (incompatibility) {
        addIssue(issues, act.id, incompatibility);
        continue;
      }
      replaceWithWholeRestoration(tooth, {
        appearance,
        kind: 'restoration',
        material,
        restoration,
      });
    }
    return;
  }

  if (act.code === 'ROOT_CANAL_FILLING') {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural') {
        addIssue(
          issues,
          act.id,
          `Root-canal treatment skipped on tooth ${position} because it is ${tooth.base}.`,
        );
        continue;
      }
      addUniqueCondition(tooth, {
        appearance,
        kind: 'endodontic',
        state: 'root-canal',
      });
    }
    return;
  }

  if (act.code === 'EXTRACTION') {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural') {
        addIssue(
          issues,
          act.id,
          `Extraction skipped on tooth ${position} because only natural teeth are supported.`,
        );
        continue;
      }
      if (act.status === 'COMPLETED') {
        tooth.base = 'missing';
        tooth.conditions = [];
      } else {
        addUniqueCondition(tooth, {
          appearance: 'planned',
          kind: 'extraction',
        });
      }
    }
    return;
  }

  if (act.code === 'IMPLANT_PLACEMENT') {
    if (act.status === 'COMPLETED') {
      for (const position of targets) {
        const tooth = getProjectionTooth(teeth, position);
        tooth.base = 'implant';
        tooth.conditions = [];
      }
    } else {
      addIssue(
        issues,
        act.id,
        'Planned implant placement has no approved renderer symbol yet.',
      );
    }
    return;
  }

  if (act.code === 'BRIDGE') {
    const material = restorationMaterial(act.details);
    if (!material || targets.length < 2)
      return addIssue(
        issues,
        act.id,
        'A bridge needs at least two teeth and a supported material.',
      );
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      tooth.conditions = tooth.conditions.filter(
        (condition) =>
          condition.kind !== 'restoration' &&
          condition.kind !== 'bridge' &&
          condition.kind !== 'caries' &&
          condition.kind !== 'filling',
      );
      tooth.conditions.push({
        appearance,
        bridgeId: act.id,
        kind: 'bridge',
        material,
        role: tooth.base === 'missing' ? 'pontic' : 'abutment',
      });
    }
    return;
  }

  addIssue(
    issues,
    act.id,
    'This treatment act is recorded but not visualized in the current odontogram.',
  );
};

const addSurfaceConditions = (
  record: Pick<ClinicalFinding | TreatmentAct, 'id' | 'target'>,
  targets: readonly ToothPosition[],
  teeth: Map<ToothPosition, MutableTooth>,
  issues: TreatmentOdontogramProjectionIssue[],
  factory: (surface: OdontogramSurface) => OdontogramCondition,
): void => {
  if (record.target.surfaces.length === 0) {
    return addIssue(
      issues,
      record.id,
      'At least one tooth surface is required.',
    );
  }
  for (const position of targets) {
    const tooth = getProjectionTooth(teeth, position);
    if (tooth.base !== 'natural') {
      addIssue(
        issues,
        record.id,
        `Surface condition skipped on tooth ${position} because it is ${tooth.base}.`,
      );
      continue;
    }
    for (const surface of record.target.surfaces)
      addUniqueCondition(tooth, factory(SURFACES[surface]));
  }
};

const replaceWithWholeRestoration = (
  tooth: MutableTooth,
  condition: OdontogramCondition,
): void => {
  if (tooth.base === 'missing') return;
  tooth.conditions = tooth.conditions.filter(
    (candidate) =>
      candidate.kind !== 'restoration' &&
      candidate.kind !== 'bridge' &&
      candidate.kind !== 'caries' &&
      candidate.kind !== 'filling',
  );
  tooth.conditions.push(condition);
};

const wholeRestorationIncompatibility = (
  tooth: MutableTooth,
  position: ToothPosition,
  restoration: RestorationType,
  material: RestorationMaterial,
): string | null => {
  if (tooth.base === 'missing') {
    return `Restoration skipped on tooth ${position} because the tooth is missing.`;
  }
  if (tooth.base === 'implant' && restoration !== 'crown') {
    return `Only a crown can be visualized on implant tooth ${position}.`;
  }
  if (restoration === 'onlay' && ANTERIOR_POSITIONS.has(position)) {
    return `Onlay skipped on anterior tooth ${position} because the approved asset has no matching view.`;
  }
  if (restoration !== 'crown' && !PARTIAL_RESTORATION_MATERIALS.has(material)) {
    return `${material} is not supported for ${restoration} visualization.`;
  }
  return null;
};

const addUniqueCondition = (
  tooth: MutableTooth,
  condition: OdontogramCondition,
): void => {
  const key = conditionKey(condition);
  tooth.conditions = tooth.conditions.filter(
    (candidate) => conditionKey(candidate) !== key,
  );
  tooth.conditions.push(condition);
};

const conditionKey = (condition: OdontogramCondition): string => {
  if (condition.kind === 'caries' || condition.kind === 'filling') {
    return `${condition.kind}:${condition.surface}`;
  }
  return condition.kind;
};

const restorationMaterial = (
  details: readonly ClinicalDetail[],
): RestorationMaterial | undefined =>
  RESTORATION_MATERIALS[
    detailString(details, 'RESTORATION_MATERIAL') ?? 'ZIRCON'
  ];

const detailString = (
  details: readonly ClinicalDetail[],
  key: string,
): string | undefined => {
  const value = details.find((detail) => detail.key === key)?.value;
  return typeof value === 'string' ? value : undefined;
};

const detailNumber = (
  details: readonly ClinicalDetail[],
  key: string,
): number | undefined => {
  const value = details.find((detail) => detail.key === key)?.value;
  return typeof value === 'number' ? value : undefined;
};

const getTargetTeeth = (
  toothNumbers: readonly number[],
  recordId: string,
  issues: TreatmentOdontogramProjectionIssue[],
): readonly ToothPosition[] => {
  const targets = toothNumbers.filter((position): position is ToothPosition =>
    (TOOTH_POSITIONS as readonly number[]).includes(position),
  );
  if (targets.length !== toothNumbers.length) {
    addIssue(
      issues,
      recordId,
      'One or more tooth numbers are not supported FDI positions.',
    );
  }
  return targets;
};

const addIssue = (
  issues: TreatmentOdontogramProjectionIssue[],
  recordId: string,
  reason: string,
): void => {
  issues.push({ reason, recordId });
};

const getProjectionTooth = (
  teeth: ReadonlyMap<ToothPosition, MutableTooth>,
  position: ToothPosition,
): MutableTooth => {
  const tooth = teeth.get(position);
  if (!tooth) {
    throw new Error(`Missing odontogram projection tooth ${position}.`);
  }
  return tooth;
};
