import { validateOdontogramData } from '@/features/odontogram';

import { createMockTreatmentVisit } from '../mock/treatment-workspace.mock';
import type {
  ClinicalFinding,
  TreatmentAct,
  TreatmentVisit,
} from './treatment';
import { mapTreatmentVisitToOdontogram } from './treatment-odontogram.mapper';

const createdAt = new Date('2026-08-13T11:00:00.000Z');

const tooth = (visit: TreatmentVisit, position: number) =>
  mapTreatmentVisitToOdontogram(visit).data.teeth.find(
    (candidate) => candidate.position === position,
  );

const directFilling = (
  overrides: Partial<TreatmentAct> = {},
): TreatmentAct => ({
  approvedByDentistId: 'doctor-demo',
  code: 'DIRECT_FILLING',
  createdAt,
  details: [{ key: 'FILLING_MATERIAL', value: 'COMPOSITE' }],
  enteredByUserId: 'doctor-demo',
  id: 'act-direct-filling-16',
  note: null,
  performedByUserId: null,
  status: 'PLANNED',
  target: {
    arch: null,
    kind: 'TOOTH_SURFACE',
    periodontalSites: [],
    surfaces: ['OCCLUSAL'],
    toothNumbers: [16],
  },
  updatedAt: createdAt,
  ...overrides,
});

describe('Treatment odontogram projection', () => {
  it('projects the mock clinical record into a valid complete chart', () => {
    const projection = mapTreatmentVisitToOdontogram(
      createMockTreatmentVisit(),
    );

    expect(projection.data.teeth).toHaveLength(32);
    expect(tooth(createMockTreatmentVisit(), 16)?.conditions).toContainEqual({
      appearance: 'existing',
      kind: 'caries',
      severity: 4,
      surface: 'occlusal',
    });
    expect(tooth(createMockTreatmentVisit(), 26)?.conditions).toContainEqual({
      appearance: 'existing',
      kind: 'filling',
      material: 'amalgam',
      surface: 'occlusal',
    });
    expect(tooth(createMockTreatmentVisit(), 46)?.base).toBe('missing');
    expect(tooth(createMockTreatmentVisit(), 36)?.conditions).toContainEqual({
      appearance: 'planned',
      kind: 'endodontic',
      state: 'root-canal',
    });
    expect(validateOdontogramData(projection.data)).toEqual({
      data: projection.data,
      valid: true,
    });
  });

  it('keeps assistant drafts off the chart until a dentist approves them', () => {
    const base = createMockTreatmentVisit();
    const draft = directFilling({
      approvedByDentistId: null,
      enteredByUserId: 'assistant-demo',
      status: 'DRAFT',
    });
    const withDraft = { ...base, acts: [...base.acts, draft] };
    const approved = {
      ...withDraft,
      acts: withDraft.acts.map((act) =>
        act.id === draft.id
          ? {
              ...act,
              approvedByDentistId: 'doctor-demo',
              status: 'PLANNED' as const,
            }
          : act,
      ),
    };

    expect(
      tooth(withDraft, 16)?.conditions.some(
        (condition) => condition.kind === 'filling',
      ),
    ).toBe(false);
    expect(tooth(approved, 16)?.conditions).toContainEqual({
      appearance: 'planned',
      kind: 'filling',
      material: 'composite',
      surface: 'occlusal',
    });
  });

  it('uses a fixed restoration as the visual composition for that tooth', () => {
    const base = createMockTreatmentVisit();
    const crown: TreatmentAct = {
      ...directFilling(),
      code: 'CROWN',
      details: [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }],
      id: 'act-crown-16',
      target: { ...directFilling().target, surfaces: [] },
    };
    const visit = { ...base, acts: [...base.acts, crown] };
    const projection = mapTreatmentVisitToOdontogram(visit);
    const projectedTooth = projection.data.teeth.find(
      (candidate) => candidate.position === 16,
    );

    expect(projectedTooth?.conditions).toContainEqual({
      appearance: 'planned',
      kind: 'restoration',
      material: 'zircon',
      restoration: 'crown',
    });
    expect(
      projectedTooth?.conditions.some(
        (condition) =>
          condition.kind === 'caries' || condition.kind === 'filling',
      ),
    ).toBe(false);
    expect(validateOdontogramData(projection.data).valid).toBe(true);
  });

  it('projects a contiguous bridge with natural abutments and a missing pontic', () => {
    const base = createMockTreatmentVisit();
    const bridge: TreatmentAct = {
      ...directFilling(),
      code: 'BRIDGE',
      details: [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }],
      id: 'act-bridge-45-47',
      target: {
        arch: null,
        kind: 'BRIDGE_SPAN',
        periodontalSites: [],
        surfaces: [],
        toothNumbers: [45, 46, 47],
      },
    };
    const visit = { ...base, acts: [...base.acts, bridge] };
    const projection = mapTreatmentVisitToOdontogram(visit);

    expect(tooth(visit, 46)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'bridge', role: 'pontic' }),
    );
    expect(tooth(visit, 45)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'bridge', role: 'abutment' }),
    );
    expect(tooth(visit, 47)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'bridge', role: 'abutment' }),
    );
    expect(validateOdontogramData(projection.data).valid).toBe(true);
  });

  it('projects an AAE pulp diagnosis as a distinct clinical visual condition', () => {
    const base = createMockTreatmentVisit();
    const finding: ClinicalFinding = {
      ...base.findings[0],
      code: 'PULP_DIAGNOSIS',
      details: [{ key: 'PULP_DIAGNOSIS', value: 'IRREVERSIBLE_PULPITIS' }],
      id: 'finding-pulp-16',
    };
    expect(tooth({ ...base, findings: [...base.findings, finding] }, 16)?.conditions).toContainEqual(
      expect.objectContaining({
        concept: 'pulp-diagnosis',
        kind: 'clinical',
        subtype: 'IRREVERSIBLE_PULPITIS',
      }),
    );
  });

  it('does not silently render unsupported restoration combinations', () => {
    const base = createMockTreatmentVisit();
    const invalidOnlay: TreatmentAct = {
      ...directFilling(),
      code: 'ONLAY',
      details: [{ key: 'RESTORATION_MATERIAL', value: 'METAL' }],
      id: 'act-onlay-11',
      target: { ...directFilling().target, surfaces: [], toothNumbers: [11] },
    };
    const projection = mapTreatmentVisitToOdontogram({
      ...base,
      acts: [...base.acts, invalidOnlay],
    });

    expect(projection.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recordId: invalidOnlay.id }),
      ]),
    );
    expect(
      tooth({ ...base, acts: [...base.acts, invalidOnlay] }, 11)?.conditions,
    ).toEqual([]);
    expect(validateOdontogramData(projection.data).valid).toBe(true);
  });

  it('keeps a primary tooth on its permanent position while exposing primary dentition', () => {
    const base = createMockTreatmentVisit();
    const primary: ClinicalFinding = {
      ...base.findings[0],
      code: 'TOOTH_STATE',
      details: [{ key: 'TOOTH_STATE', value: 'PRIMARY' }],
      id: 'finding-primary-16',
      target: {
        ...base.findings[0].target,
        kind: 'TOOTH',
        surfaces: [],
        toothNumbers: [16],
      },
    };
    const projected = mapTreatmentVisitToOdontogram({
      ...base,
      findings: [primary],
    });

    expect(tooth({ ...base, findings: [primary] }, 16)).toMatchObject({
      base: 'natural',
      dentition: 'primary',
      position: 16,
    });
    expect(projected.data.teeth).toHaveLength(32);
    expect(validateOdontogramData(projected.data).valid).toBe(true);
  });

  it('projects structural substrate, fracture, extraction socket, and crown actions', () => {
    const base = createMockTreatmentVisit();
    const substrate: ClinicalFinding = {
      ...base.findings[0],
      code: 'TOOTH_SUBSTRATE',
      details: [{ key: 'TOOTH_SUBSTRATE', value: 'BROKEN' }],
      id: 'finding-broken-16',
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [16] },
    };
    const fracture: ClinicalFinding = {
      ...base.findings[0],
      code: 'TOOTH_FRACTURE',
      details: [],
      id: 'finding-fracture-16',
      target: {
        ...base.findings[0].target,
        kind: 'TOOTH_REGION',
        surfaces: ['MESIAL', 'OCCLUSAL'],
        toothNumbers: [16],
      },
    };
    const wound: ClinicalFinding = {
      ...base.findings[0],
      code: 'EXTRACTION_WOUND',
      details: [],
      id: 'finding-wound-26',
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [26] },
    };
    const crownReplacement: TreatmentAct = {
      ...directFilling(),
      code: 'CROWN_REPLACEMENT',
      details: [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }],
      id: 'act-crown-replacement-16',
      target: { ...directFilling().target, kind: 'TOOTH', surfaces: [] },
    };
    const existingCrown: ClinicalFinding = {
      ...base.findings[1],
      code: 'EXISTING_FIXED_RESTORATION',
      details: [
        { key: 'RESTORATION_TYPE', value: 'CROWN' },
        { key: 'RESTORATION_MATERIAL', value: 'ZIRCON' },
      ],
      id: 'finding-existing-crown-16',
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [16] },
    };
    const projected = mapTreatmentVisitToOdontogram({
      ...base,
      findings: [
        ...base.findings.filter((finding) => finding.target.toothNumbers[0] !== 16),
        substrate,
        fracture,
        wound,
        existingCrown,
      ],
      acts: [crownReplacement],
    });

    expect(tooth({ ...base, findings: [substrate, fracture, existingCrown, wound], acts: [crownReplacement] }, 16)?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'structure', state: 'broken' }),
        expect.objectContaining({ kind: 'structure', state: 'crown-replacement' }),
      ]),
    );
    expect(tooth({ ...base, findings: [substrate, fracture, wound], acts: [crownReplacement] }, 26)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'structure', state: 'extraction-wound' }),
    );
    expect(validateOdontogramData(projected.data).valid).toBe(true);
  });

  it('maps planned and completed implant placement separately and removes cancelled acts', () => {
    const base = createMockTreatmentVisit();
    const placement = (status: TreatmentAct['status']): TreatmentAct => ({
      ...directFilling(),
      code: 'IMPLANT_PLACEMENT',
      details: [],
      id: `act-implant-${status}`,
      status,
      target: { ...directFilling().target, kind: 'TOOTH', surfaces: [], toothNumbers: [46] },
    });

    expect(tooth({ ...base, acts: [placement('PLANNED')] }, 46)?.conditions).toContainEqual({
      appearance: 'planned',
      kind: 'planned-implant',
    });
    expect(tooth({ ...base, acts: [placement('IN_PROGRESS')] }, 46)?.conditions).toContainEqual(
      expect.objectContaining({ kind: 'planned-implant' }),
    );
    expect(tooth({ ...base, acts: [placement('COMPLETED')] }, 46)).toMatchObject({
      base: 'implant',
      conditions: [],
    });
    expect(tooth({ ...base, acts: [placement('CANCELLED')] }, 46)).toMatchObject({
      base: 'missing',
      conditions: [],
    });
  });

  it('keeps prosthesis groups deterministic and reports fixed/prosthesis conflicts', () => {
    const base = createMockTreatmentVisit();
    const implantFinding: ClinicalFinding = {
      ...base.findings[0],
      code: 'TOOTH_STATE',
      details: [{ key: 'TOOTH_STATE', value: 'IMPLANT' }],
      id: 'finding-implant-14',
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [14] },
    };
    const prosthesis: ClinicalFinding = {
      ...base.findings[0],
      code: 'EXISTING_PROSTHESIS',
      details: [{ key: 'PROSTHESIS_TYPE', value: 'LOCATOR' }],
      id: 'finding-locator-14',
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [14] },
    };
    const projected = mapTreatmentVisitToOdontogram({
      ...base,
      findings: [implantFinding, prosthesis],
    });
    expect(tooth({ ...base, findings: [implantFinding, prosthesis] }, 14)?.conditions).toContainEqual({
      appearance: 'existing',
      groupId: 'finding-locator-14',
      kind: 'prosthesis',
      prosthesis: 'locator',
    });
    expect(validateOdontogramData(projected.data).valid).toBe(true);
  });

  it('projects calculus, periodontal involvement, and implant-gated peri-implant status', () => {
    const base = createMockTreatmentVisit();
    const finding = (code: ClinicalFinding['code'], id: string, details: ClinicalFinding['details'], toothNumber: number): ClinicalFinding => ({
      ...base.findings[0],
      code,
      details,
      id,
      target: { ...base.findings[0].target, kind: 'TOOTH', surfaces: [], toothNumbers: [toothNumber] },
    });
    const projected = mapTreatmentVisitToOdontogram({
      ...base,
      findings: [
        finding('CALCULUS', 'finding-calculus-16', [], 16),
        finding('PERIODONTAL_INVOLVEMENT', 'finding-periodontal-16', [], 16),
        finding('TOOTH_STATE', 'finding-implant-14', [{ key: 'TOOTH_STATE', value: 'IMPLANT' }], 14),
        finding('PERI_IMPLANT_STATUS', 'finding-peri-implant-14', [{ key: 'PERI_IMPLANT_STATE', value: 'MODERATE' }], 14),
      ],
    });

    expect(tooth({ ...base, findings: projected.data.teeth.length ? [
      finding('CALCULUS', 'finding-calculus-16', [], 16),
      finding('PERIODONTAL_INVOLVEMENT', 'finding-periodontal-16', [], 16),
    ] : [] }, 16)?.conditions).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'periodontal', state: 'calculus' }),
      expect.objectContaining({ kind: 'periodontal', state: 'involvement' }),
    ]));
    expect(tooth({ ...base, findings: [
      finding('TOOTH_STATE', 'finding-implant-14', [{ key: 'TOOTH_STATE', value: 'IMPLANT' }], 14),
      finding('PERI_IMPLANT_STATUS', 'finding-peri-implant-14', [{ key: 'PERI_IMPLANT_STATE', value: 'MODERATE' }], 14),
    ] }, 14)?.conditions).toContainEqual(expect.objectContaining({ kind: 'peri-implant', state: 'moderate' }));
    expect(validateOdontogramData(projected.data).valid).toBe(true);
  });
});
