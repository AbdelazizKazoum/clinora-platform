import {
  TOOTH_POSITIONS,
  type FillingMaterial,
  type ImplantProsthesisType,
  type OdontogramAppearance,
  type OdontogramCondition,
  type OdontogramData,
  type RestorationMaterial,
  type RestorationType,
  type ToothBase,
  type ToothDentition,
  type ToothFractureRegion,
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

const PROSTHESIS_TYPES: Record<string, ImplantProsthesisType> = {
  BAR: 'bar',
  BAR_DENTURE: 'bar-overdenture',
  HEALING_ABUTMENT: 'healing-abutment',
  LOCATOR: 'locator',
  LOCATOR_DENTURE: 'locator-overdenture',
  REMOVABLE_FULL: 'removable-full',
  REMOVABLE_PARTIAL: 'removable-partial',
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
  dentition: ToothDentition;
  conditions: OdontogramCondition[];
};

export const mapTreatmentVisitToOdontogram = (
  visit: TreatmentVisit,
): TreatmentOdontogramProjection => {
  const teeth = new Map<ToothPosition, MutableTooth>(
    TOOTH_POSITIONS.map((position) => [
      position,
       { base: 'natural', conditions: [], dentition: 'permanent', position },
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
    const supportedState = [
      'NATURAL',
      'MISSING',
      'IMPLANT',
      'PRIMARY',
      'UNDER_GUM',
      'MISSING_AFTER_EXTRACTION',
    ].includes(state ?? '');
    if (!supportedState) return addIssue(issues, finding.id, 'Unsupported tooth state.');
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      clearStructuralState(tooth);
      if (state === 'MISSING' || state === 'MISSING_AFTER_EXTRACTION') {
        tooth.base = 'missing';
        tooth.dentition = 'permanent';
        tooth.conditions = [];
        if (state === 'MISSING_AFTER_EXTRACTION') {
          addUniqueCondition(tooth, {
            kind: 'structure',
            state: 'missing-after-extraction',
          });
        }
      } else if (state === 'IMPLANT') {
        tooth.base = 'implant';
        tooth.dentition = 'permanent';
        tooth.conditions = [];
      } else {
        tooth.base = 'natural';
        tooth.dentition = state === 'PRIMARY' ? 'primary' : 'permanent';
        if (state === 'UNDER_GUM') {
          addUniqueCondition(tooth, { kind: 'structure', state: 'under-gum' });
        }
      }
    }
    return;
  }

  if (finding.code === 'TOOTH_SUBSTRATE') {
    const substrate = detailString(finding.details, 'TOOTH_SUBSTRATE');
    const stateBySubstrate: Record<string, 'natural' | 'radix' | 'broken' | 'crown-preparation'> = {
      BROKEN: 'broken',
      CROWNPREP: 'crown-preparation',
      NATURAL: 'natural',
      RADIX: 'radix',
    };
    const state = stateBySubstrate[substrate ?? ''];
    if (!state) return addIssue(issues, finding.id, 'Unsupported tooth substrate.');
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural' || tooth.dentition === 'primary') {
        addIssue(issues, finding.id, `Tooth substrate skipped on tooth ${position}.`);
        continue;
      }
      clearStructuralState(tooth);
      if (state !== 'natural') {
        addUniqueCondition(tooth, { kind: 'structure', state });
      }
    }
    return;
  }

  if (finding.code === 'TOOTH_FRACTURE') {
    const regions = finding.target.surfaces
      .filter((surface): surface is 'MESIAL' | 'DISTAL' | 'OCCLUSAL' =>
        surface === 'MESIAL' || surface === 'DISTAL' || surface === 'OCCLUSAL',
      )
      .map((surface): ToothFractureRegion =>
        surface === 'OCCLUSAL' ? 'incisal' : surface.toLowerCase() as 'mesial' | 'distal',
      );
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural' || tooth.dentition === 'primary') {
        addIssue(issues, finding.id, `Fracture skipped on tooth ${position}.`);
        continue;
      }
      clearStructuralState(tooth);
      addUniqueCondition(tooth, {
        fractureRegions: regions.length > 0 ? regions : ['incisal'],
        kind: 'structure',
        state: 'broken',
      });
    }
    return;
  }

  if (finding.code === 'EXTRACTION_WOUND') {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      tooth.base = 'missing';
      tooth.conditions = [];
      addUniqueCondition(tooth, {
        kind: 'structure',
        state: 'extraction-wound',
      });
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

  if (finding.code === 'EXISTING_PROSTHESIS') {
    const prosthesis =
      PROSTHESIS_TYPES[detailString(finding.details, 'PROSTHESIS_TYPE') ?? ''];
    if (!prosthesis) {
      return addIssue(issues, finding.id, 'Unsupported prosthesis type.');
    }
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (!isProsthesisCompatible(tooth, prosthesis)) {
        addIssue(issues, finding.id, `Prosthesis is not compatible with tooth ${position}.`);
        continue;
      }
      addUniqueCondition(tooth, {
        appearance: 'existing',
        groupId: finding.id,
        kind: 'prosthesis',
        prosthesis,
      });
    }
    return;
  }

  if (
    finding.code === 'CALCULUS' ||
    finding.code === 'PERIODONTAL_INVOLVEMENT'
  ) {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'natural') {
        addIssue(issues, finding.id, `Periodontal layer skipped on tooth ${position}.`);
        continue;
      }
      addUniqueCondition(tooth, {
        appearance: 'existing',
        kind: 'periodontal',
        state: finding.code === 'CALCULUS' ? 'calculus' : 'involvement',
      });
    }
    return;
  }

  if (finding.code === 'PERI_IMPLANT_STATUS') {
    const state = detailString(finding.details, 'PERI_IMPLANT_STATE');
    const stateMap: Record<string, 'mucositis' | 'mild' | 'moderate' | 'severe' | undefined> = {
      MILD: 'mild',
      MODERATE: 'moderate',
      MUCOSITIS: 'mucositis',
      SEVERE: 'severe',
    };
    const periImplantState = stateMap[state ?? ''];
    if (!periImplantState) return;
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (tooth.base !== 'implant') {
        addIssue(issues, finding.id, `Peri-implant status requires implant tooth ${position}.`);
        continue;
      }
      addUniqueCondition(tooth, {
        appearance: 'existing',
        kind: 'peri-implant',
        state: periImplantState,
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
        addUniqueCondition(tooth, {
          kind: 'structure',
          state: 'missing-after-extraction',
        });
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
        if (tooth.base === 'implant') continue;
        tooth.base = 'implant';
        tooth.conditions = [];
      }
    } else {
      for (const position of targets) {
        const tooth = getProjectionTooth(teeth, position);
        if (tooth.base === 'implant') {
          addIssue(issues, act.id, `Planned implant skipped on existing implant tooth ${position}.`);
          continue;
        }
        addUniqueCondition(tooth, {
          appearance: 'planned',
          kind: 'planned-implant',
        });
      }
    }
    return;
  }

  if (
    act.code === 'HEALING_ABUTMENT' ||
    act.code === 'LOCATOR_ATTACHMENT' ||
    act.code === 'LOCATOR_OVERDENTURE' ||
    act.code === 'BAR_ATTACHMENT' ||
    act.code === 'BAR_OVERDENTURE' ||
    act.code === 'PARTIAL_REMOVABLE_DENTURE' ||
    act.code === 'COMPLETE_REMOVABLE_DENTURE'
  ) {
    const prosthesis = prosthesisForAct(act.code);
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      if (!isProsthesisCompatible(tooth, prosthesis)) {
        addIssue(issues, act.id, `Prosthesis act is not compatible with tooth ${position}.`);
        continue;
      }
      if (hasIncompatibleProsthesis(tooth, prosthesis)) {
        addIssue(issues, act.id, `Prosthesis act conflicts with existing prosthesis on tooth ${position}.`);
        continue;
      }
      addUniqueCondition(tooth, {
        appearance,
        groupId: act.id,
        kind: 'prosthesis',
        prosthesis,
      });
    }
    return;
  }

  if (act.code === 'CROWN_REPLACEMENT') {
    for (const position of targets) {
      const tooth = getProjectionTooth(teeth, position);
      const hasExistingRestoration = tooth.conditions.some(
        (condition) =>
          condition.kind === 'restoration' || condition.kind === 'bridge',
      );
      if (!hasExistingRestoration) {
        addIssue(issues, act.id, `Crown replacement requires an existing restoration on tooth ${position}.`);
        continue;
      }
      addUniqueCondition(tooth, {
        appearance,
        kind: 'structure',
        state: 'crown-replacement',
      });
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
      if (tooth.conditions.some((condition) => condition.kind === 'prosthesis')) {
        addIssue(issues, act.id, `Bridge conflicts with prosthesis on tooth ${position}.`);
        continue;
      }
      tooth.conditions = tooth.conditions.filter(
        (condition) =>
          condition.kind !== 'restoration' &&
          condition.kind !== 'bridge' &&
          condition.kind !== 'caries' &&
          condition.kind !== 'filling',
      );
      addUniqueCondition(tooth, {
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
  if (tooth.conditions.some((condition) => condition.kind === 'prosthesis')) {
    return `Restoration conflicts with prosthesis on tooth ${position}.`;
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

const clearStructuralState = (tooth: MutableTooth): void => {
  tooth.conditions = tooth.conditions.filter(
    (condition) =>
      condition.kind !== 'structure' && condition.kind !== 'planned-implant',
  );
};

const isProsthesisCompatible = (
  tooth: MutableTooth,
  prosthesis: ImplantProsthesisType,
): boolean =>
  tooth.base === 'implant'
    ? !prosthesis.startsWith('removable-')
    : tooth.base === 'missing' && prosthesis.startsWith('removable-');

const hasIncompatibleProsthesis = (
  tooth: MutableTooth,
  next: ImplantProsthesisType,
): boolean =>
  tooth.conditions.some(
    (condition) =>
      condition.kind === 'prosthesis' && condition.prosthesis !== next,
  );

const prosthesisForAct = (
  code:
    | 'HEALING_ABUTMENT'
    | 'LOCATOR_ATTACHMENT'
    | 'LOCATOR_OVERDENTURE'
    | 'BAR_ATTACHMENT'
    | 'BAR_OVERDENTURE'
    | 'PARTIAL_REMOVABLE_DENTURE'
    | 'COMPLETE_REMOVABLE_DENTURE',
): ImplantProsthesisType => {
  switch (code) {
    case 'HEALING_ABUTMENT':
      return 'healing-abutment';
    case 'LOCATOR_ATTACHMENT':
      return 'locator';
    case 'LOCATOR_OVERDENTURE':
      return 'locator-overdenture';
    case 'BAR_ATTACHMENT':
      return 'bar';
    case 'BAR_OVERDENTURE':
      return 'bar-overdenture';
    case 'PARTIAL_REMOVABLE_DENTURE':
      return 'removable-partial';
    case 'COMPLETE_REMOVABLE_DENTURE':
      return 'removable-full';
  }
};

const conditionKey = (condition: OdontogramCondition): string => {
  if (condition.kind === 'caries' || condition.kind === 'filling') {
    return `${condition.kind}:${condition.surface}`;
  }
  if (condition.kind === 'bridge') return `${condition.kind}:${condition.bridgeId}`;
  if (condition.kind === 'prosthesis') {
    return `${condition.kind}:${condition.groupId}`;
  }
  if (condition.kind === 'structure') return `${condition.kind}:${condition.state}`;
  if (condition.kind === 'planned-implant') return condition.kind;
  if (condition.kind === 'periodontal' || condition.kind === 'peri-implant') {
    return `${condition.kind}:${condition.state}`;
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
