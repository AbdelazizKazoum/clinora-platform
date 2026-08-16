import type {
  ClinicalFindingCode,
  TreatmentActCode,
} from './treatment';

/**
 * Describes what the current Clinora renderer can honestly project. This is
 * deliberately more precise than the old `visualized` flag: a record may be
 * clinically valid while having no symbol in the active renderer.
 */
export type OdontogramProjectionSupport =
  | 'none'
  | 'record-only'
  | 'existing-only'
  | 'planned-only'
  | 'existing-and-planned';

export type OdontogramViewSupport = 'side' | 'occlusal';

export interface TreatmentCapability {
  readonly projection: OdontogramProjectionSupport;
  readonly lifecycle: readonly (
    | 'existing'
    | 'planned'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
    | 'entered-in-error'
  )[];
  readonly views: readonly OdontogramViewSupport[];
  readonly bases: readonly ('natural' | 'missing' | 'implant' | 'primary')[];
  readonly dentitions: readonly ('permanent' | 'primary')[];
  readonly svgLayers: readonly string[];
  readonly applicability: readonly string[];
  readonly subtypeSupport?: Readonly<
    Record<string, OdontogramProjectionSupport>
  >;
  readonly subtypeBases?: Readonly<
    Record<string, readonly ('natural' | 'missing' | 'implant' | 'primary')[]>
  >;
}

const existingFinding = (
  overrides: Partial<TreatmentCapability> = {},
): TreatmentCapability => ({
  applicability: ['confirmed finding'],
  bases: ['natural', 'missing', 'implant'],
  dentitions: ['permanent', 'primary'],
  lifecycle: ['existing'],
  projection: 'record-only',
  svgLayers: [],
  views: ['side', 'occlusal'],
  ...overrides,
});

const plannedAct = (
  projection: OdontogramProjectionSupport = 'record-only',
  overrides: Partial<TreatmentCapability> = {},
): TreatmentCapability => ({
  applicability: ['planned or completed act'],
  bases: ['natural', 'missing', 'implant'],
  dentitions: ['permanent', 'primary'],
  lifecycle: ['planned', 'in-progress', 'completed'],
  projection,
  svgLayers: [],
  views: ['side', 'occlusal'],
  ...overrides,
});

export const TREATMENT_ACT_CAPABILITIES: Record<
  TreatmentActCode,
  TreatmentCapability
> = {
  APICOECTOMY: plannedAct(),
  BAR_ATTACHMENT: plannedAct('existing-and-planned', {
    applicability: ['existing implant fixture'],
    bases: ['implant'],
    svgLayers: ['implant-connector', 'implant-locator-screw', 'implant-bar'],
  }),
  BAR_OVERDENTURE: plannedAct('existing-and-planned', {
    applicability: ['implant-supported prosthesis group'],
    bases: ['implant'],
    svgLayers: ['implant-bar', 'prosthesis-implant'],
  }),
  BRIDGE: plannedAct('existing-and-planned', {
    applicability: ['bridge span with at least two tooth units'],
    svgLayers: ['bridge connector'],
  }),
  COMPLETE_REMOVABLE_DENTURE: plannedAct('existing-and-planned', {
    applicability: ['arch/gap prosthesis group'],
    bases: ['missing'],
    svgLayers: ['prosthesis', 'prosthesis-crown', 'prosthesis-connector'],
  }),
  CROWN: plannedAct('existing-and-planned', {
    svgLayers: ['restoration crown'],
  }),
  CROWN_REPLACEMENT: plannedAct('planned-only', {
    applicability: ['tooth with a compatible existing restoration'],
    svgLayers: ['crown-replace'],
  }),
  DIRECT_FILLING: plannedAct('existing-and-planned', {
    applicability: ['one or more restorative tooth surfaces'],
    svgLayers: ['filling surface'],
  }),
  EXTRACTION: plannedAct('existing-and-planned', {
    applicability: ['natural tooth'],
    svgLayers: ['extraction-plan', 'missing tooth base'],
  }),
  FISSURE_SEALING: plannedAct(),
  GLASS_FIBER_POST: plannedAct(),
  HEALING_ABUTMENT: plannedAct('existing-and-planned', {
    applicability: ['existing implant fixture'],
    bases: ['implant'],
    svgLayers: ['implant-healing-abutment'],
  }),
  IMPLANT_PLACEMENT: plannedAct('existing-and-planned', {
    applicability: ['natural or missing tooth; completed becomes existing implant'],
    bases: ['natural', 'missing', 'implant'],
    svgLayers: ['implant', 'implant-base'],
  }),
  INLAY: plannedAct('existing-and-planned', {
    applicability: ['natural tooth and supported material'],
    svgLayers: ['restoration inlay'],
  }),
  LOCATOR_ATTACHMENT: plannedAct('existing-and-planned', {
    applicability: ['existing implant fixture'],
    bases: ['implant'],
    svgLayers: ['implant-connector', 'implant-locator-screw'],
  }),
  LOCATOR_OVERDENTURE: plannedAct('existing-and-planned', {
    applicability: ['implant-supported prosthesis group'],
    bases: ['implant'],
    svgLayers: ['prosthesis-implant', 'prosthesis-implant-crown', 'prosthesis-implant-gum'],
  }),
  METAL_POST: plannedAct(),
  ONLAY: plannedAct('existing-and-planned', {
    applicability: ['posterior tooth and occlusal view'],
    svgLayers: ['restoration onlay'],
  }),
  ORTHODONTIC_APPLIANCE: plannedAct(),
  PARAPULPAL_PIN: plannedAct(),
  PARTIAL_REMOVABLE_DENTURE: plannedAct('existing-and-planned', {
    applicability: ['arch/gap prosthesis group'],
    bases: ['missing'],
    svgLayers: ['prosthesis', 'prosthesis-crown', 'prosthesis-connector'],
  }),
  ROOT_CANAL_FILLING: plannedAct('existing-and-planned', {
    applicability: ['natural tooth; side view'],
    svgLayers: ['endo-filling'],
  }),
  ROOT_CANAL_MEDICATION: plannedAct(),
  ROOT_CANAL_REPAIR: plannedAct(),
  VENEER: plannedAct('existing-and-planned', {
    applicability: ['natural tooth and supported material'],
    svgLayers: ['restoration veneer'],
  }),
};

export const CLINICAL_FINDING_CAPABILITIES: Record<
  ClinicalFindingCode,
  TreatmentCapability
> = {
  APICAL_DIAGNOSIS: existingFinding(),
  CALCULUS: existingFinding(),
  CARIES: existingFinding({
    projection: 'existing-only',
    svgLayers: ['caries surface'],
  }),
  CONTACT_POINT_DEFECT: existingFinding(),
  CROWN_LEAKAGE: existingFinding(),
  DISCOLORATION: existingFinding(),
  EXISTING_ENDODONTIC_STATE: existingFinding({
    projection: 'existing-only',
    applicability: ['root-canal-filling subtype only in the current renderer'],
    subtypeSupport: {
      GLASS_FIBER_POST: 'record-only',
      INCOMPLETE: 'record-only',
      MEDICATION: 'record-only',
      METAL_POST: 'record-only',
      ROOT_CANAL_FILLING: 'existing-only',
    },
    svgLayers: ['endo-filling'],
  }),
  EXISTING_FILLING: existingFinding({
    projection: 'existing-only',
    svgLayers: ['filling surface'],
  }),
  EXISTING_FIXED_RESTORATION: existingFinding({
    projection: 'existing-only',
    svgLayers: ['restoration'],
  }),
  EXISTING_PROSTHESIS: existingFinding({
    bases: ['implant', 'missing'],
    projection: 'existing-only',
    subtypeBases: {
      BAR: ['implant'],
      BAR_DENTURE: ['implant'],
      HEALING_ABUTMENT: ['implant'],
      LOCATOR: ['implant'],
      LOCATOR_DENTURE: ['implant'],
      REMOVABLE_FULL: ['missing'],
      REMOVABLE_PARTIAL: ['missing'],
    },
    svgLayers: ['implant/prosthesis composition'],
  }),
  EXTRACTION_WOUND: existingFinding({
    projection: 'existing-only',
    svgLayers: ['no-tooth-after-extraction'],
  }),
  FURCATION_INVOLVEMENT: existingFinding(),
  GINGIVAL_FINDING: existingFinding(),
  MOBILITY: existingFinding(),
  ORTHODONTIC_STATE: existingFinding(),
  PERIAPICAL_LESION: existingFinding(),
  PERI_IMPLANT_STATUS: existingFinding(),
  PERIODONTAL_INVOLVEMENT: existingFinding(),
  PERIODONTAL_MEASUREMENT: existingFinding(),
  PLAQUE_FINDING: existingFinding(),
  PULP_DIAGNOSIS: existingFinding(),
  ROOT_CARIES: existingFinding(),
  ROOT_RESORPTION: existingFinding(),
  TOOTH_FRACTURE: existingFinding({
    bases: ['natural'],
    dentitions: ['permanent'],
    projection: 'existing-only',
    svgLayers: ['tooth-broken-*'],
  }),
  TOOTH_STATE: existingFinding({
    applicability: ['confirmed structural tooth status'],
    bases: ['natural', 'missing', 'implant', 'primary'],
    projection: 'existing-only',
      subtypeSupport: {
        IMPLANT: 'existing-only',
        MISSING: 'existing-only',
        MISSING_AFTER_EXTRACTION: 'existing-only',
        NATURAL: 'existing-only',
        PRIMARY: 'existing-only',
        UNDER_GUM: 'existing-only',
    },
    svgLayers: ['natural base', 'missing base', 'implant-base'],
  }),
  TOOTH_SUBSTRATE: existingFinding({
    bases: ['natural'],
    dentitions: ['permanent'],
    projection: 'existing-only',
    svgLayers: ['tooth-under-gum', 'tooth-radix', 'tooth-broken-*', 'tooth-crownprep'],
  }),
  TOOTH_WEAR: existingFinding(),
};

export interface OdontogramAxisCapability {
  readonly id: string;
  readonly source: 'legacy-axis' | 'legacy-special-field';
  readonly kind:
    | 'enum'
    | 'boolean'
    | 'set'
    | 'surface-map'
    | 'derived';
  readonly projection: OdontogramProjectionSupport;
  readonly svgLayers: readonly string[];
  readonly applicability: readonly string[];
  readonly recordOnly: boolean;
}

const axis = (
  id: string,
  kind: OdontogramAxisCapability['kind'],
  projection: OdontogramProjectionSupport,
  svgLayers: readonly string[] = [],
  applicability: readonly string[] = [],
): OdontogramAxisCapability => ({
  applicability,
  id,
  kind,
  projection,
  recordOnly: projection === 'record-only' || projection === 'none',
  source: 'legacy-axis',
  svgLayers,
});

/** Reviewed inventory of `registry/axes.ts` before Clinora parity work. */
export const ODONTOGRAM_AXIS_CAPABILITIES: readonly OdontogramAxisCapability[] = [
  axis('toothSelection', 'enum', 'existing-only', ['implant', 'milktooth', 'tooth-under-gum', 'no-tooth-after-extraction']),
  axis('endo', 'enum', 'record-only', ['endo-medical-filling', 'endo-filling', 'endo-filling-incomplete', 'endo-glass-pin', 'endo-metal-pin']),
  axis('toothSubstrate', 'enum', 'record-only', ['tooth-radix', 'tooth-under-gum', 'tooth-crownprep']),
  axis('restorationType', 'enum', 'record-only'),
  axis('restorationMaterial', 'enum', 'record-only'),
  axis('prosthesis', 'enum', 'record-only'),
  axis('mobility', 'enum', 'record-only', ['mobility'], ['not an implant']),
  axis('caries', 'set', 'existing-only', ['caries-*', 'caries-subcrown']),
  axis('mods', 'set', 'record-only', ['inflammation', 'parodontal', 'mobility']),
  axis('calculus', 'boolean', 'record-only', ['calculus'], ['present natural tooth']),
  axis('periapicalType', 'enum', 'record-only', ['granuloma', 'cysta', 'abscess']),
  axis('fillingMaterial', 'surface-map', 'existing-only', ['filling-{material}-{surface}']),
  axis('endoResection', 'boolean', 'record-only', ['endo-resection']),
  axis('fissureSealing', 'boolean', 'record-only', ['fissure-sealing']),
  axis('contactMesial', 'boolean', 'record-only', ['mesial-no-contact-point']),
  axis('contactDistal', 'boolean', 'record-only', ['distal-no-contact-point']),
  axis('brokenMesial', 'boolean', 'record-only', ['tooth-broken-mesial*']),
  axis('brokenIncisal', 'boolean', 'record-only', ['tooth-broken-incisal*']),
  axis('brokenDistal', 'boolean', 'record-only', ['tooth-broken-distal*']),
  axis('parapulpalPin', 'boolean', 'record-only', ['parapulpal-pin']),
  axis('bridgePillar', 'boolean', 'record-only', ['bridge connector']),
  axis('extractionWound', 'boolean', 'record-only', ['extraction-wound']),
  axis('extractionPlan', 'boolean', 'record-only', ['extraction-plan']),
  axis('crownReplace', 'boolean', 'planned-only', ['crown-replace']),
  axis('crownNeeded', 'boolean', 'planned-only', ['crown-needed']),
  axis('missingClosed', 'boolean', 'record-only', ['missing-closed']),
  axis('crownLeakage', 'boolean', 'record-only', ['crown-leakage'], ['crown or bridge restoration']),
  axis('pulpDx', 'enum', 'record-only', ['tooth-inflam-pulp']),
  axis('pulpLatin', 'enum', 'record-only'),
  axis('apicalDx', 'enum', 'record-only', ['granuloma', 'cysta', 'abscess']),
  axis('resorptionType', 'enum', 'record-only', ['endo-resorption']),
  axis('wearEdge', 'enum', 'record-only', ['tooth-bruxism-wear']),
  axis('wearCervical', 'enum', 'record-only', ['tooth-bruxism-neck-wear']),
  axis('discoloration', 'enum', 'record-only'),
  axis('orthoAppliance', 'enum', 'record-only', ['ortho-bracket', 'ortho-ring']),
  axis('orthoDrift', 'enum', 'record-only', ['arrow-mesial', 'arrow-distal']),
  axis('orthoVertical', 'enum', 'record-only', ['arrow-up', 'arrow-down']),
  axis('orthoRotation', 'boolean', 'record-only', ['arrow-rotation']),
  axis('rootCaries', 'enum', 'record-only', ['caries-root']),
  axis('cejVisibility', 'enum', 'record-only'),
  axis('rootConcavity', 'enum', 'record-only'),
  axis('gingivalThickness', 'enum', 'record-only'),
  axis('millerClass', 'enum', 'record-only'),
  axis('periImplant', 'enum', 'record-only', ['peri-implant-bone-loss'], ['implant only']),
  {
    applicability: ['one or more restorative surfaces'],
    id: 'secondaryCaries',
    kind: 'surface-map',
    projection: 'record-only',
    recordOnly: true,
    source: 'legacy-special-field',
    svgLayers: ['subcaries-{surface}'],
  },
  {
    applicability: ['one or more restorative surfaces'],
    id: 'radiographicDepth',
    kind: 'surface-map',
    projection: 'record-only',
    recordOnly: true,
    source: 'legacy-special-field',
    svgLayers: [],
  },
  {
    applicability: ['one or more filled surfaces'],
    id: 'fillingDefect',
    kind: 'surface-map',
    projection: 'record-only',
    recordOnly: true,
    source: 'legacy-special-field',
    svgLayers: ['defect-{surface}'],
  },
];

export const ODONTOGRAM_AXIS_CAPABILITY_BY_ID = Object.fromEntries(
  ODONTOGRAM_AXIS_CAPABILITIES.map((item) => [item.id, item]),
) as Record<string, OdontogramAxisCapability>;

export interface OdontogramRecordCapability {
  readonly id: string;
  readonly geometry: 'tooth' | 'surface' | 'periodontal-site' | 'furcation' | 'mouth';
  readonly projection: 'record-only' | 'none';
  readonly applicability: readonly string[];
  readonly derived: boolean;
}

/** Periodontal and record-only concepts reviewed from the upstream chart. */
export const ODONTOGRAM_PERIODONTAL_RECORD_CAPABILITIES: readonly OdontogramRecordCapability[] = [
  { id: 'periodontal.pd', geometry: 'periodontal-site', projection: 'record-only', applicability: ['MB/B/DB/ML/L/DL'], derived: false },
  { id: 'periodontal.gingival-margin', geometry: 'periodontal-site', projection: 'record-only', applicability: ['MB/B/DB/ML/L/DL'], derived: false },
  { id: 'periodontal.cal', geometry: 'periodontal-site', projection: 'record-only', applicability: ['derived from pd + gingival margin'], derived: true },
  { id: 'periodontal.bop', geometry: 'periodontal-site', projection: 'record-only', applicability: ['charted probing sites'], derived: false },
  { id: 'periodontal.suppuration', geometry: 'periodontal-site', projection: 'record-only', applicability: ['charted probing sites'], derived: false },
  { id: 'periodontal.mobility', geometry: 'tooth', projection: 'record-only', applicability: ['present natural tooth'], derived: false },
  { id: 'periodontal.furcation', geometry: 'furcation', projection: 'record-only', applicability: ['position-aware entrances'], derived: false },
  { id: 'periodontal.plaque', geometry: 'surface', projection: 'record-only', applicability: ["four O'Leary surfaces"], derived: false },
  { id: 'periodontal.pi', geometry: 'surface', projection: 'record-only', applicability: ['four index surfaces'], derived: false },
  { id: 'periodontal.gi', geometry: 'surface', projection: 'record-only', applicability: ['four index surfaces'], derived: false },
  { id: 'periodontal.mpi', geometry: 'surface', projection: 'record-only', applicability: ['four surfaces; implant only'], derived: false },
  { id: 'periodontal.mbi', geometry: 'surface', projection: 'record-only', applicability: ['four surfaces; implant only'], derived: false },
  { id: 'periodontal.keratinized-gingiva', geometry: 'tooth', projection: 'record-only', applicability: ['buccal width 0-15 mm'], derived: false },
  { id: 'periodontal.cej-visibility', geometry: 'tooth', projection: 'record-only', applicability: ['categorical detail'], derived: false },
  { id: 'periodontal.root-concavity', geometry: 'tooth', projection: 'record-only', applicability: ['categorical detail'], derived: false },
  { id: 'periodontal.gingival-phenotype', geometry: 'tooth', projection: 'record-only', applicability: ['thin/medium/thick'], derived: false },
  { id: 'periodontal.miller-class', geometry: 'tooth', projection: 'record-only', applicability: ['I-IV'], derived: false },
  { id: 'periodontal.cairo-recession', geometry: 'tooth', projection: 'record-only', applicability: ['derived from approved probing inputs'], derived: true },
  { id: 'periodontal.whole-mouth-summary', geometry: 'mouth', projection: 'record-only', applicability: ['derived from charted records'], derived: true },
  { id: 'periodontal.classification', geometry: 'mouth', projection: 'none', applicability: ['clinician-approved derivation'], derived: true },
];

/** Semantic upstream layer vocabulary, kept out of the runtime manifest. */
export const ODONTOGRAM_UPSTREAM_LAYER_IDS: readonly string[] = [
  'tooth-base', 'tooth-base-beauty', 'tooth-healthy-pulp', 'tooth-inflam-pulp',
  'implant', 'implant-base', 'implant-connector', 'implant-healing-abutment',
  'implant-locator-screw', 'implant-bar', 'prosthesis', 'prosthesis-implant',
  'prosthesis-implant-crown', 'prosthesis-implant-gum', 'milktooth',
  'milktooth-base', 'milktooth-beauty', 'milktooth-healthy-pulp',
  'milktooth-inflam-pulp', 'tooth-under-gum', 'tooth-radix', 'tooth-crownprep',
  'tooth-broken-incisal', 'tooth-broken-mesial', 'tooth-broken-distal',
  'tooth-broken-mesial-distal', 'tooth-broken-distal-incisal',
  'tooth-broken-mesial-incisal', 'tooth-broken-mesial-distal-incisal',
  'no-tooth-after-extraction', 'extraction-plan', 'extraction-wound',
  'missing-closed', 'crown-needed', 'crown-replace', 'fissure-sealing',
  'mesial-no-contact-point', 'distal-no-contact-point', 'crown-leakage',
  'endo-medical-filling', 'endo-filling', 'endo-filling-incomplete',
  'endo-glass-pin', 'endo-metal-pin', 'endo-resection', 'parapulpal-pin',
  'endo-resorption', 'granuloma', 'cysta', 'abscess', 'inflammation',
  'parodontal', 'mobility', 'calculus', 'caries-root', 'caries-subcrown',
  'subcaries-{surface}', 'caries-{surface}', 'defect-{surface}',
  'filling-{material}-{surface}', 'temporary-restorations',
  'ortho-bracket', 'ortho-ring', 'arrow-mesial', 'arrow-distal', 'arrow-up',
  'arrow-down', 'arrow-rotation', 'peri-implant-bone-loss',
  'telescope-crown', 'zircon-crown', 'metal-crown', 'temporary-crown',
  'emax-inlay', 'gold-inlay', 'gradia-inlay', 'zircon-inlay', 'temporary-inlay',
  'emax-onlay', 'gold-onlay', 'gradia-onlay', 'zircon-onlay', 'temporary-onlay',
  'emax-veneer', 'gold-veneer', 'gradia-veneer', 'zircon-veneer', 'temporary-veneer',
  'emax-bridge-connector', 'gold-bridge-connector', 'gradia-bridge-connector',
  'metal-ceramic-bridge-connector', 'zircon-bridge-connector',
  'metal-bridge-connector', 'temporary-bridge-connector',
  'telescope-bridge-connector',
];

export const hasExplicitCapabilityMetadata = (
  capability: TreatmentCapability | undefined,
): capability is TreatmentCapability =>
  Boolean(
    capability &&
      capability.projection &&
      capability.lifecycle.length > 0 &&
      capability.views.length > 0 &&
      capability.bases.length > 0 &&
      capability.dentitions.length > 0 &&
      Array.isArray(capability.svgLayers) &&
      Array.isArray(capability.applicability),
  );

export type TreatmentCapabilityPresentation =
  | 'visual'
  | 'record-only'
  | 'not-available';

export interface TreatmentCapabilityContext {
  readonly base: 'natural' | 'missing' | 'implant';
  readonly dentition: 'permanent' | 'primary';
  readonly subtype?: string;
}

export const getTreatmentCapabilityPresentation = (
  capability: TreatmentCapability,
  context: TreatmentCapabilityContext,
): TreatmentCapabilityPresentation => {
  if (
    !capability.bases.includes(context.base) ||
    !capability.dentitions.includes(context.dentition) ||
    (context.subtype !== undefined &&
      capability.subtypeBases?.[context.subtype] !== undefined &&
      !capability.subtypeBases[context.subtype].includes(context.base)) ||
    capability.projection === 'none'
  ) {
    return 'not-available';
  }
  return capability.projection === 'record-only' ? 'record-only' : 'visual';
};
