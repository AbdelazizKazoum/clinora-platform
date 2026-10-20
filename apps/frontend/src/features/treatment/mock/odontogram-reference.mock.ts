import { TREATMENT_ACT_OPTIONS } from '../model/treatment-catalogue';
import { createTreatmentActInput } from '../model/treatment-inputs';
import type {
  ClinicalFinding,
  ClinicalTarget,
  TreatmentActCode,
  TreatmentActStatus,
  TreatmentVisit,
} from '../model/treatment';
import { createMockTreatmentVisit } from './treatment-workspace.mock';

/** Synthetic, read-only cases for development review; never used to seed patient records. */
const EXPECTED_ACT_LAYERS: Record<TreatmentActCode, readonly string[]> = {
  FISSURE_SEALING: ['fissure-sealing'],
  DIRECT_FILLING: ['filling-composite-occlusal'],
  CROWN: ['zircon-crown'],
  INLAY: ['zircon-inlay'],
  ONLAY: ['zircon-onlay'],
  VENEER: ['zircon-veneer'],
  BRIDGE: ['zircon-crown', 'zircon-bridge-connector'],
  ROOT_CANAL_MEDICATION: ['endo-medical-filling'],
  ROOT_CANAL_FILLING: ['endo-filling'],
  ROOT_CANAL_REPAIR: ['endo-filling-incomplete'],
  GLASS_FIBER_POST: ['endo-filling', 'endo-glass-pin'],
  METAL_POST: ['endo-filling', 'endo-metal-pin'],
  APICOECTOMY: ['endo-resection'],
  PARAPULPAL_PIN: ['parapulpal-pin'],
  EXTRACTION: ['extraction-plan'],
  IMPLANT_PLACEMENT: ['implant', 'implant-base'],
  HEALING_ABUTMENT: ['implant-healing-abutment'],
  LOCATOR_ATTACHMENT: ['implant-connector', 'implant-locator-screw'],
  LOCATOR_OVERDENTURE: [
    'prosthesis-implant',
    'prosthesis-implant-crown',
    'prosthesis-implant-gum',
  ],
  BAR_ATTACHMENT: ['implant-bar'],
  BAR_OVERDENTURE: ['implant-bar', 'prosthesis-implant'],
  PARTIAL_REMOVABLE_DENTURE: ['prosthesis', 'prosthesis-crown'],
  COMPLETE_REMOVABLE_DENTURE: ['prosthesis', 'prosthesis-crown'],
  CROWN_REPLACEMENT: ['metal-crown', 'crown-replace'],
  ORTHODONTIC_APPLIANCE: ['ortho-bracket'],
};

export const ODONTOGRAM_ACT_REFERENCE_CASES = TREATMENT_ACT_OPTIONS.map(
  ({ code, label }) => ({
    code,
    label,
    expectedLayers: EXPECTED_ACT_LAYERS[code],
  }),
);

export function createOdontogramActReference(
  code: TreatmentActCode,
  status: TreatmentActStatus = 'PLANNED',
): TreatmentVisit {
  const base = createMockTreatmentVisit();
  const findings: ClinicalFinding[] = [];
  const target: ClinicalTarget = {
    kind: 'TOOTH',
    arch: null,
    toothNumbers: [16],
    surfaces: [],
    periodontalSites: [],
  };
  const state = (value: string) =>
    findings.push({
      ...base.findings[0],
      id: `reference-state-${value}`,
      code: 'TOOTH_STATE',
      target: {
        kind: 'TOOTH',
        arch: null,
        toothNumbers: [16],
        surfaces: [],
        periodontalSites: [],
      },
      details: [{ key: 'TOOTH_STATE', value }],
    });
  const option = TREATMENT_ACT_OPTIONS.find(
    (candidate) => candidate.code === code,
  );
  if (!option) {
    throw new Error(
      `Missing treatment-act reference configuration for ${code}.`,
    );
  }
  if (option.target === 'surface') {
    target.kind = 'TOOTH_SURFACE';
    target.surfaces = ['OCCLUSAL'];
  }
  if (option.target === 'arch') {
    target.kind = 'ARCH';
    target.arch = 'UPPER';
  }
  if (code === 'BRIDGE') {
    state('MISSING');
    target.kind = 'BRIDGE_SPAN';
    target.toothNumbers = [15, 16, 17];
  }
  if (
    [
      'HEALING_ABUTMENT',
      'LOCATOR_ATTACHMENT',
      'LOCATOR_OVERDENTURE',
      'BAR_ATTACHMENT',
      'BAR_OVERDENTURE',
    ].includes(code)
  )
    state('IMPLANT');
  if (
    code === 'PARTIAL_REMOVABLE_DENTURE' ||
    code === 'COMPLETE_REMOVABLE_DENTURE' ||
    code === 'IMPLANT_PLACEMENT'
  )
    state('MISSING');
  if (code === 'CROWN_REPLACEMENT')
    findings.push({
      ...base.findings[0],
      id: 'reference-existing-crown',
      code: 'EXISTING_FIXED_RESTORATION',
      target,
      details: [
        { key: 'RESTORATION_TYPE', value: 'CROWN' },
        { key: 'RESTORATION_MATERIAL', value: 'METAL' },
      ],
    });
  const details =
    option.requiresMaterial === 'restoration'
      ? [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }]
      : option.requiresMaterial === 'filling'
        ? [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }]
        : code === 'ORTHODONTIC_APPLIANCE'
          ? [{ key: 'ORTHODONTIC_APPLIANCE', value: 'BRACKET' }]
          : [];
  const input = createTreatmentActInput({
    id: `reference-${code}`,
    code,
    target,
    details,
  });
  return {
    ...base,
    id: 'synthetic-reference',
    patientId: 'synthetic-reference',
    clinicId: 'synthetic-reference',
    findings,
    clinicalNotes: 'Synthetic visual reference. No patient data is saved.',
    acts: [{ ...base.acts[0], ...input, note: null, status }],
  };
}
