import {
  CLINICAL_FINDING_CODES,
  DOCUMENTATION_HANDOFF_STATUSES,
  SUPPORTED_CLINICAL_FINDING_CATALOGUE,
  SUPPORTED_TREATMENT_ACT_CATALOGUE,
  TREATMENT_ACT_CODES,
  TREATMENT_ACT_STATUSES,
  TREATMENT_VISIT_STATUSES,
} from './treatment.contract.js';

describe('treatment contract', () => {
  it('defines explicit terminal and review lifecycle states', () => {
    expect(TREATMENT_VISIT_STATUSES).toEqual([
      'DRAFT',
      'IN_PROGRESS',
      'AWAITING_REVIEW',
      'READY_FOR_COMPLETION',
      'COMPLETED',
      'CANCELLED',
    ]);
    expect(DOCUMENTATION_HANDOFF_STATUSES).toContain('RETURNED');
    expect(TREATMENT_ACT_STATUSES).toContain('ENTERED_IN_ERROR');
  });

  it('has one catalogue entry for every supported act code', () => {
    expect(SUPPORTED_TREATMENT_ACT_CATALOGUE.map(({ code }) => code)).toEqual(
      TREATMENT_ACT_CODES,
    );
    expect(new Set(TREATMENT_ACT_CODES).size).toBe(TREATMENT_ACT_CODES.length);
    expect(
      SUPPORTED_TREATMENT_ACT_CATALOGUE.every(
        ({ requiresDentistApproval }) => requiresDentistApproval,
      ),
    ).toBe(true);
  });

  it('keeps clinical findings separate from treatment acts', () => {
    expect(
      SUPPORTED_CLINICAL_FINDING_CATALOGUE.map(({ code }) => code),
    ).toEqual(CLINICAL_FINDING_CODES);
    expect(TREATMENT_ACT_CODES).not.toContain('CARIES');
    expect(CLINICAL_FINDING_CODES).toContain('CARIES');
  });

  it('captures tooth detail and periodontal coverage without renderer fields', () => {
    const caries = SUPPORTED_CLINICAL_FINDING_CATALOGUE.find(
      ({ code }) => code === 'CARIES',
    );
    const periodontal = SUPPORTED_CLINICAL_FINDING_CATALOGUE.find(
      ({ code }) => code === 'PERIODONTAL_MEASUREMENT',
    );

    expect(caries).toMatchObject({
      allowedTargets: ['TOOTH_SURFACE'],
      supportedDetailKeys: ['ICDAS_CARS_SEVERITY', 'RADIOGRAPHIC_DEPTH'],
    });
    expect(periodontal?.supportedDetailKeys).toEqual(
      expect.arrayContaining([
        'PROBING_DEPTH_MM',
        'GINGIVAL_MARGIN_MM',
        'BLEEDING_ON_PROBING',
        'SUPPURATION',
      ]),
    );
    expect(JSON.stringify(SUPPORTED_TREATMENT_ACT_CATALOGUE)).not.toContain(
      'svg',
    );
  });
});
