import {
  CLINICAL_FINDING_CAPABILITIES,
  ODONTOGRAM_AXIS_CAPABILITIES,
  TREATMENT_ACT_CAPABILITIES,
  ODONTOGRAM_PERIODONTAL_RECORD_CAPABILITIES,
  ODONTOGRAM_UPSTREAM_LAYER_IDS,
  getTreatmentCapabilityPresentation,
  hasExplicitCapabilityMetadata,
} from './treatment-capabilities';
import {
  CLINICAL_FINDING_OPTIONS,
  getClinicalFindingOption,
  getTreatmentActOption,
  TREATMENT_ACT_OPTIONS,
} from './treatment-catalogue';
import {
  createTreatmentActInput,
  createTreatmentFindingInput,
} from './treatment-inputs';
import { CLINICAL_FINDING_CODES, TREATMENT_ACT_CODES } from './treatment';

const toothTarget = {
  arch: null,
  kind: 'TOOTH' as const,
  periodontalSites: [],
  surfaces: [],
  toothNumbers: [16],
};

describe('PARITY-01 capability inventory', () => {
  it('keeps every declared act and finding backed by explicit capability metadata', () => {
    expect(TREATMENT_ACT_OPTIONS).toHaveLength(25);
    expect(CLINICAL_FINDING_OPTIONS).toHaveLength(27);
    expect(TREATMENT_ACT_CODES).toHaveLength(25);
    expect(CLINICAL_FINDING_CODES).toHaveLength(27);

    for (const code of TREATMENT_ACT_CODES) {
      const option = getTreatmentActOption(code);
      expect(option?.capability).toBe(TREATMENT_ACT_CAPABILITIES[code]);
      expect(hasExplicitCapabilityMetadata(option?.capability)).toBe(true);
    }
    for (const code of CLINICAL_FINDING_CODES) {
      const option = getClinicalFindingOption(code);
      expect(option?.capability).toBe(CLINICAL_FINDING_CAPABILITIES[code]);
      expect(hasExplicitCapabilityMetadata(option?.capability)).toBe(true);
      for (const subtype of option?.detailOptions ?? []) {
        expect(hasExplicitCapabilityMetadata(subtype.capability)).toBe(true);
      }
    }
  });

  it('keeps legacy axis and special per-surface fields executable', () => {
    expect(ODONTOGRAM_AXIS_CAPABILITIES).toHaveLength(47);
    expect(
      ODONTOGRAM_AXIS_CAPABILITIES.find(({ id }) => id === 'secondaryCaries')
        ?.source,
    ).toBe('legacy-special-field');
    expect(
      ODONTOGRAM_AXIS_CAPABILITIES.find(({ id }) => id === 'radiographicDepth')
        ?.recordOnly,
    ).toBe(true);
    expect(
      ODONTOGRAM_AXIS_CAPABILITIES.find(({ id }) => id === 'toothSelection')
        ?.svgLayers,
    ).toContain('tooth-under-gum');
    expect(ODONTOGRAM_PERIODONTAL_RECORD_CAPABILITIES).toHaveLength(20);
    expect(ODONTOGRAM_UPSTREAM_LAYER_IDS).toContain('peri-implant-bone-loss');
  });

  it('distinguishes clinical validation from renderer capability', () => {
    const input = createTreatmentFindingInput({
      code: 'PULP_DIAGNOSIS',
      details: [
        { key: 'PULP_DIAGNOSIS', value: 'NECROSIS' },
      ],
      id: 'finding-pulp-16',
      target: toothTarget,
    });

    expect(input.code).toBe('PULP_DIAGNOSIS');
    expect(getClinicalFindingOption('PULP_DIAGNOSIS')?.capability.projection).toBe(
      'record-only',
    );
  });

  it('reports subtype and tooth-base applicability without changing Treatment meaning', () => {
    const option = getClinicalFindingOption('EXISTING_PROSTHESIS');
    if (option === undefined) throw new Error('Missing prosthesis catalogue option');
    const capability = option.capability;
    const missingRemovable = getTreatmentCapabilityPresentation(capability, {
      base: 'missing',
      dentition: 'permanent',
      subtype: 'REMOVABLE_PARTIAL',
    });
    const missingLocator = getTreatmentCapabilityPresentation(capability, {
      base: 'missing',
      dentition: 'permanent',
      subtype: 'LOCATOR',
    });

    expect(missingRemovable).toBe('visual');
    expect(missingLocator).toBe('not-available');
  });

  it('rejects interchangeable target geometries at the UI boundary', () => {
    expect(() =>
      createTreatmentActInput({
        code: 'DIRECT_FILLING',
        details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }],
        id: 'act-invalid-target',
        target: toothTarget,
      }),
    ).toThrow('TOOTH_SURFACE');

    expect(() =>
      createTreatmentFindingInput({
        code: 'PERIODONTAL_MEASUREMENT',
        details: [{ key: 'PROBING_DEPTH_MM', value: 4 }],
        id: 'finding-invalid-target',
        target: toothTarget,
      }),
    ).toThrow('PERIODONTAL_SITE');
  });

  it('validates typed restorative and periodontal geometry independently', () => {
    expect(
      createTreatmentActInput({
        code: 'DIRECT_FILLING',
        details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }],
        id: 'act-filling-16',
        target: {
          ...toothTarget,
          kind: 'TOOTH_SURFACE',
          surfaces: ['OCCLUSAL'],
        },
      }).target.kind,
    ).toBe('TOOTH_SURFACE');

    expect(
      createTreatmentFindingInput({
        code: 'PERIODONTAL_MEASUREMENT',
        details: [{ key: 'PROBING_DEPTH_MM', value: 4 }],
        id: 'finding-perio-16',
        target: {
          ...toothTarget,
          kind: 'PERIODONTAL_SITE',
          periodontalSites: ['B'],
        },
      }).target.kind,
    ).toBe('PERIODONTAL_SITE');
  });
});
