import { validateOdontogramData } from '@/features/odontogram';
import { createMockTreatmentVisit } from '../mock/treatment-workspace.mock';
import type {
  ClinicalFinding,
  TreatmentAct,
  TreatmentVisit,
} from './treatment';
import {
  createTreatmentActInput,
  createTreatmentFindingInput,
} from './treatment-inputs';
import { mapTreatmentVisitToOdontogram } from './treatment-odontogram.mapper';

const target = {
  arch: null,
  kind: 'TOOTH' as const,
  toothNumbers: [16],
  surfaces: [],
  periodontalSites: [],
};
const finding = (
  code: ClinicalFinding['code'],
  details: ClinicalFinding['details'],
  overrides: Partial<ClinicalFinding> = {},
): ClinicalFinding => ({
  ...createMockTreatmentVisit().findings[0],
  id: `finding-${code}`,
  code,
  details,
  target,
  ...overrides,
});
const act = (
  code: TreatmentAct['code'],
  details: TreatmentAct['details'],
  status: TreatmentAct['status'] = 'PLANNED',
): TreatmentAct => ({
  ...createMockTreatmentVisit().acts[0],
  id: `act-${code}`,
  code,
  details,
  status,
  target,
});
const visit = (
  findings: readonly ClinicalFinding[],
  acts: readonly TreatmentAct[] = [],
): TreatmentVisit => ({ ...createMockTreatmentVisit(), findings, acts });
const project = (record: TreatmentVisit) => {
  const projection = mapTreatmentVisitToOdontogram(record);
  expect(projection.issues).toEqual([]);
  expect(validateOdontogramData(projection.data).valid).toBe(true);
  const projectedTooth = projection.data.teeth.find(
    ({ position }) => position === 16,
  );
  if (!projectedTooth) throw new Error('Projected tooth 16 is missing.');
  return projectedTooth;
};

describe('Treatment charting parity regressions', () => {
  it('records a closed gap as a missing tooth with its specific marker', () => {
    const record = finding('TOOTH_STATE', [
      { key: 'TOOTH_STATE', value: 'MISSING_CLOSED' },
    ]);
    expect(() => createTreatmentFindingInput(record)).not.toThrow();
    expect(project(visit([record]))).toMatchObject({
      base: 'missing',
      conditions: [{ kind: 'structure', state: 'missing-closed' }],
    });
  });

  it.each(['BRACKET', 'BAND'])(
    'projects a planned/completed %s and excludes cancelled/draft records',
    (value) => {
      const appliance = act('ORTHODONTIC_APPLIANCE', [
        { key: 'ORTHODONTIC_APPLIANCE', value },
      ]);
      expect(() => createTreatmentActInput(appliance)).not.toThrow();
      for (const status of ['PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const) {
        expect(
          project(visit([], [{ ...appliance, status }])).conditions,
        ).toContainEqual({
          kind: 'clinical',
          concept: 'ortho-appliance',
          subtype: value,
          appearance: status === 'COMPLETED' ? 'existing' : 'planned',
        });
      }
      for (const status of [
        'DRAFT',
        'CANCELLED',
        'ENTERED_IN_ERROR',
      ] as const) {
        expect(
          project(visit([], [{ ...appliance, status }])).conditions,
        ).toEqual([]);
      }
      expect(() =>
        createTreatmentActInput({ ...appliance, details: [] }),
      ).toThrow('ORTHODONTIC_APPLIANCE');
    },
  );

  it('preserves independent incisal and cervical erosion', () => {
    const record = finding(
      'TOOTH_WEAR',
      [
        { key: 'WEAR_EDGE_TYPE', value: 'EROSION' },
        { key: 'WEAR_CERVICAL_TYPE', value: 'EROSION' },
      ],
      { target: { ...target, kind: 'TOOTH_SURFACE', surfaces: ['BUCCAL'] } },
    );
    expect(() => createTreatmentFindingInput(record)).not.toThrow();
    expect(project(visit([record])).conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ concept: 'wear-edge', subtype: 'EROSION' }),
        expect.objectContaining({
          concept: 'wear-cervical',
          subtype: 'EROSION',
        }),
      ]),
    );
    expect(() =>
      createTreatmentFindingInput({ ...record, details: [] }),
    ).toThrow('wear type');
  });

  it('rejects incompatible Latin pulp detail rather than changing a diagnosis', () => {
    const record = finding('PULP_DIAGNOSIS', [
      { key: 'PULP_DIAGNOSIS', value: 'REVERSIBLE_PULPITIS' },
      { key: 'PULP_LATIN', value: 'HYPERAEMIA_PULPAE' },
    ]);
    expect(() => createTreatmentFindingInput(record)).not.toThrow();
    expect(() =>
      createTreatmentFindingInput({
        ...record,
        details: [
          { key: 'PULP_DIAGNOSIS', value: 'NECROSIS' },
          record.details[1],
        ],
      }),
    ).toThrow('must match');
  });

  it('records an existing bridge with one span identity and an explicit pontic', () => {
    const gap = finding('TOOTH_STATE', [
      { key: 'TOOTH_STATE', value: 'MISSING' },
    ]);
    const bridge = finding(
      'EXISTING_FIXED_RESTORATION',
      [
        { key: 'RESTORATION_TYPE', value: 'BRIDGE' },
        { key: 'RESTORATION_MATERIAL', value: 'METAL_CERAMIC' },
      ],
      {
        target: { ...target, kind: 'BRIDGE_SPAN', toothNumbers: [15, 16, 17] },
      },
    );
    expect(() => createTreatmentFindingInput(bridge)).not.toThrow();
    expect(project(visit([gap, bridge])).conditions).toContainEqual({
      kind: 'bridge',
      bridgeId: bridge.id,
      role: 'pontic',
      material: 'metal-ceramic',
      appearance: 'existing',
    });
    expect(() => createTreatmentFindingInput({ ...bridge, target })).toThrow(
      'BRIDGE_SPAN',
    );
  });

  it('uses the replacement material only after crown replacement is completed', () => {
    const crown = finding('EXISTING_FIXED_RESTORATION', [
      { key: 'RESTORATION_TYPE', value: 'CROWN' },
      { key: 'RESTORATION_MATERIAL', value: 'METAL' },
    ]);
    const replacement = act('CROWN_REPLACEMENT', [
      { key: 'RESTORATION_MATERIAL', value: 'ZIRCON' },
    ]);
    expect(project(visit([crown], [replacement])).conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'restoration', material: 'metal' }),
        expect.objectContaining({
          kind: 'structure',
          state: 'crown-replacement',
          appearance: 'planned',
        }),
      ]),
    );
    expect(
      project(visit([crown], [{ ...replacement, status: 'COMPLETED' }]))
        .conditions,
    ).toEqual([
      {
        kind: 'restoration',
        restoration: 'crown',
        material: 'zircon',
        appearance: 'existing',
      },
    ]);
  });

  it('adds and retires the crown-needed marker through the treatment lifecycle', () => {
    const crown = act('CROWN', [
      { key: 'RESTORATION_MATERIAL', value: 'ZIRCON' },
    ]);
    expect(project(visit([], [crown])).conditions).toContainEqual({
      kind: 'structure',
      state: 'crown-needed',
      appearance: 'planned',
    });
    expect(
      project(visit([], [{ ...crown, status: 'COMPLETED' }])).conditions,
    ).not.toContainEqual(expect.objectContaining({ state: 'crown-needed' }));
  });

  it('supports gap units in a bar-supported prosthesis without changing their structural base to implant', () => {
    const gap = finding('TOOTH_STATE', [
      { key: 'TOOTH_STATE', value: 'MISSING' },
    ]);
    const bar = {
      ...act('BAR_OVERDENTURE', []),
      target: { ...target, kind: 'ARCH' as const, arch: 'UPPER' as const },
    };
    expect(project(visit([gap], [bar]))).toMatchObject({
      base: 'missing',
      conditions: [
        expect.objectContaining({
          kind: 'prosthesis',
          prosthesis: 'bar-overdenture',
        }),
      ],
    });
  });

  it('rejects fractional severity, unknown surfaces, duplicated details, and cross-arch targets', () => {
    const caries = finding(
      'CARIES',
      [{ key: 'ICDAS_CARS_SEVERITY', value: 2.5 }],
      { target: { ...target, kind: 'TOOTH_SURFACE', surfaces: ['OCCLUSAL'] } },
    );
    expect(() => createTreatmentFindingInput(caries)).toThrow('between');
    expect(() =>
      createTreatmentFindingInput({
        ...caries,
        details: [
          { key: 'ICDAS_CARS_SEVERITY', value: 2 },
          { key: 'ICDAS_CARS_SEVERITY', value: 3 },
        ],
      }),
    ).toThrow('duplicate');
    expect(() =>
      createTreatmentActInput({
        ...act('COMPLETE_REMOVABLE_DENTURE', []),
        target: {
          ...target,
          kind: 'ARCH',
          arch: 'UPPER',
          toothNumbers: [16, 36],
        },
      }),
    ).toThrow('upper and lower');
  });
});
