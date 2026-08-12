import {
  TOOTH_POSITIONS,
  validateOdontogramData,
  type OdontogramCondition,
  type OdontogramData,
  type OdontogramDataIssue,
  type OdontogramSelection,
  type RestorationMaterial,
  type RestorationType,
  type ToothBase,
  type ToothPosition,
} from '..';

type BridgeCondition = Extract<
  OdontogramCondition,
  { readonly kind: 'bridge' }
>;
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

interface BridgeFixtureUnit {
  readonly position: ToothPosition;
  readonly base: ToothBase;
  readonly role: BridgeCondition['role'];
  readonly material?: RestorationMaterial;
  readonly appearance?: BridgeCondition['appearance'];
}

const caries = (
  surface: 'buccal' | 'lingual' | 'mesial' | 'distal' | 'occlusal' = 'occlusal',
): CariesCondition => ({
  kind: 'caries',
  surface,
  severity: 2,
  appearance: 'existing',
});

const filling = (
  surface: 'buccal' | 'lingual' | 'mesial' | 'distal' | 'occlusal' = 'occlusal',
): FillingCondition => ({
  kind: 'filling',
  surface,
  material: 'composite',
  appearance: 'existing',
});

const restoration = (
  restorationType: RestorationType = 'crown',
  material: RestorationMaterial = 'zircon',
): RestorationCondition => ({
  kind: 'restoration',
  restoration: restorationType,
  material,
  appearance: 'existing',
});

const endodontic = (appearance: 'existing' | 'planned' = 'existing') =>
  ({
    kind: 'endodontic',
    state: 'root-canal',
    appearance,
  }) satisfies OdontogramCondition;

const extraction = (): OdontogramCondition => ({
  kind: 'extraction',
  appearance: 'planned',
});

function createEmptyChart(): OdontogramData {
  return {
    teeth: TOOTH_POSITIONS.map((position) => ({
      position,
      base: 'natural',
      conditions: [],
    })),
  };
}

function replaceTooth(
  data: OdontogramData,
  position: ToothPosition,
  base: ToothBase,
  conditions: readonly OdontogramCondition[],
): OdontogramData {
  return {
    teeth: data.teeth.map((tooth) =>
      tooth.position === position ? { position, base, conditions } : tooth,
    ),
  };
}

function withBridge(
  units: readonly BridgeFixtureUnit[],
  bridgeId = 'bridge-1',
): OdontogramData {
  return units.reduce(
    (data, unit) =>
      replaceTooth(data, unit.position, unit.base, [
        {
          kind: 'bridge',
          bridgeId,
          role: unit.role,
          material: unit.material ?? 'zircon',
          appearance: unit.appearance ?? 'existing',
        },
      ]),
    createEmptyChart(),
  );
}

function conditionsAt(
  data: OdontogramData,
  position: ToothPosition,
): readonly OdontogramCondition[] {
  const tooth = data.teeth.find((candidate) => candidate.position === position);
  if (tooth === undefined) {
    throw new Error(`Missing fixture tooth ${position}`);
  }
  return tooth.conditions;
}

function getInvalidIssues(input: unknown): readonly OdontogramDataIssue[] {
  const result = validateOdontogramData(input);
  if (result.valid) {
    throw new Error('Expected odontogram input to be invalid');
  }
  return result.issues;
}

function expectConditionIssue(
  input: unknown,
  position: ToothPosition,
  reason: string,
): void {
  expect(getInvalidIssues(input)).toContainEqual({
    code: 'invalid-condition',
    position,
    reason,
  });
}

describe('odontogram visual model', () => {
  describe('canonical positions and public contract', () => {
    it('defines all permanent FDI positions once in chart order', () => {
      expect(TOOTH_POSITIONS).toEqual([
        18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47,
        46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
      ]);
      expect(TOOTH_POSITIONS).toHaveLength(32);
      expect(new Set(TOOTH_POSITIONS)).toHaveProperty('size', 32);
    });

    it('defines controlled selection without coupling it to chart data', () => {
      const selection: OdontogramSelection = {
        selectedToothPositions: [16, 15],
        activeToothPosition: 15,
      };

      expect(selection).toEqual({
        selectedToothPositions: [16, 15],
        activeToothPosition: 15,
      });
    });
  });

  describe('runtime shape and chart completeness', () => {
    it('accepts a complete empty chart without cloning or mutating it', () => {
      const data = Object.freeze({
        teeth: Object.freeze(
          createEmptyChart().teeth.map((tooth) =>
            Object.freeze({
              ...tooth,
              conditions: Object.freeze(tooth.conditions),
            }),
          ),
        ),
      });

      const result = validateOdontogramData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toBe(data);
      }
    });

    it('accepts complete teeth supplied in a different order', () => {
      const data: OdontogramData = {
        teeth: [...createEmptyChart().teeth].reverse(),
      };

      const result = validateOdontogramData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toBe(data);
      }
    });

    it('rejects malformed root and teeth containers', () => {
      expect(getInvalidIssues(null)).toEqual([
        { code: 'invalid-shape', path: '$' },
      ]);
      expect(getInvalidIssues({})).toEqual([
        { code: 'invalid-shape', path: '$.teeth' },
      ]);
      expect(getInvalidIssues({ teeth: 'not-an-array' })).toEqual([
        { code: 'invalid-shape', path: '$.teeth' },
      ]);
    });

    it('rejects metadata and unknown fields at every visual boundary', () => {
      const data = createEmptyChart();
      const input = {
        ...data,
        patientId: 'patient-1',
        teeth: data.teeth.map((tooth, index) =>
          index === 0
            ? {
                ...tooth,
                visitId: 'visit-1',
                conditions: [
                  {
                    kind: 'caries',
                    surface: 'occlusal',
                    appearance: 'existing',
                    treatmentStatus: 'PROPOSED',
                  },
                ],
              }
            : tooth,
        ),
      };

      expect(getInvalidIssues(input)).toEqual([
        { code: 'invalid-shape', path: '$.patientId' },
        { code: 'invalid-shape', path: '$.teeth[0].visitId' },
        {
          code: 'invalid-shape',
          path: '$.teeth[0].conditions[0].treatmentStatus',
        },
      ]);
    });

    it('rejects malformed tooth and condition fields with stable paths', () => {
      const data = createEmptyChart();
      const input = {
        teeth: data.teeth.map((tooth, index) => {
          if (index === 0) {
            return { ...tooth, base: 'deciduous' };
          }
          if (index === 1) {
            return { ...tooth, conditions: 'caries' };
          }
          if (index === 2) {
            return {
              ...tooth,
              conditions: [{ kind: 'unknown', appearance: 'existing' }],
            };
          }
          return tooth;
        }),
      };

      expect(getInvalidIssues(input)).toEqual([
        { code: 'invalid-shape', path: '$.teeth[0].base' },
        { code: 'invalid-shape', path: '$.teeth[1].conditions' },
        { code: 'invalid-shape', path: '$.teeth[2].conditions[0].kind' },
      ]);
    });

    it('rejects unknown, duplicated, and omitted positions deterministically', () => {
      const data = createEmptyChart();
      const replacedLast = [...data.teeth.slice(0, -1), { ...data.teeth[0] }];

      expect(getInvalidIssues({ teeth: replacedLast })).toEqual([
        { code: 'duplicate-position', position: 18 },
        { code: 'missing-position', position: 38 },
      ]);

      const invalidFirst = {
        teeth: data.teeth.map((tooth, index) =>
          index === 0 ? { ...tooth, position: 99 } : tooth,
        ),
      };
      expect(getInvalidIssues(invalidFirst)).toEqual([
        { code: 'invalid-shape', path: '$.teeth[0].position' },
        { code: 'missing-position', position: 18 },
      ]);
    });

    it('never exposes partially normalized data for invalid input', () => {
      const result = validateOdontogramData({ teeth: [] });

      expect(result.valid).toBe(false);
      expect(result).not.toHaveProperty('data');
    });

    it('is total for hostile runtime objects', () => {
      const hostileInput = new Proxy(
        {},
        {
          ownKeys() {
            throw new Error('unreadable input');
          },
        },
      );

      expect(validateOdontogramData(hostileInput)).toEqual({
        valid: false,
        issues: [{ code: 'invalid-shape', path: '$' }],
      });
    });
  });

  describe('condition shapes and surfaces', () => {
    it.each([1, 2, 3, 4, 5, 6] as const)(
      'accepts caries severity %s',
      (severity) => {
        const data = replaceTooth(createEmptyChart(), 16, 'natural', [
          {
            kind: 'caries',
            surface: 'occlusal',
            severity,
            appearance: 'planned',
          },
        ]);

        expect(validateOdontogramData(data).valid).toBe(true);
      },
    );

    it('accepts omitted caries severity without inserting a default', () => {
      const condition = {
        kind: 'caries',
        surface: 'occlusal',
        appearance: 'existing',
      } as const;
      const data = replaceTooth(createEmptyChart(), 16, 'natural', [condition]);

      const result = validateOdontogramData(data);

      expect(result.valid).toBe(true);
      expect(condition).not.toHaveProperty('severity');
    });

    it.each([0, 7, 1.5, Number.NaN, '2', null])(
      'rejects invalid caries severity %p',
      (severity) => {
        const data = createEmptyChart();
        const input = {
          teeth: data.teeth.map((tooth) =>
            tooth.position === 16
              ? {
                  ...tooth,
                  conditions: [
                    {
                      kind: 'caries',
                      surface: 'occlusal',
                      severity,
                      appearance: 'existing',
                    },
                  ],
                }
              : tooth,
          ),
        };

        expect(getInvalidIssues(input)).toContainEqual({
          code: 'invalid-shape',
          path: '$.teeth[2].conditions[0].severity',
        });
      },
    );

    it.each(['buccal', 'lingual', 'mesial', 'distal', 'occlusal'] as const)(
      'accepts the canonical %s surface on a posterior tooth',
      (surface) => {
        const data = replaceTooth(createEmptyChart(), 16, 'natural', [
          caries(surface),
        ]);

        expect(validateOdontogramData(data).valid).toBe(true);
      },
    );

    it('allows same-surface caries and filling for recurrent rendering', () => {
      const data = replaceTooth(createEmptyChart(), 16, 'natural', [
        caries('occlusal'),
        filling('occlusal'),
      ]);

      expect(validateOdontogramData(data).valid).toBe(true);
    });

    it('rejects duplicate same-kind surface conditions', () => {
      let data = replaceTooth(createEmptyChart(), 16, 'natural', [
        caries('occlusal'),
        { ...caries('occlusal'), appearance: 'planned' },
      ]);
      expectConditionIssue(data, 16, 'caries may appear only once per surface');

      data = replaceTooth(createEmptyChart(), 16, 'natural', [
        filling('mesial'),
        { ...filling('mesial'), material: 'amalgam' },
      ]);
      expectConditionIssue(
        data,
        16,
        'filling may appear only once per surface',
      );
    });

    it('allows the same condition kind on different surfaces', () => {
      const data = replaceTooth(createEmptyChart(), 16, 'natural', [
        caries('mesial'),
        caries('distal'),
        filling('buccal'),
        filling('lingual'),
      ]);

      expect(validateOdontogramData(data).valid).toBe(true);
    });

    it('rejects the only permanently unrenderable surface combination', () => {
      for (const condition of [caries('lingual'), filling('lingual')]) {
        const data = replaceTooth(createEmptyChart(), 11, 'natural', [
          condition,
        ]);
        expectConditionIssue(
          data,
          11,
          'lingual surface conditions are not renderable for anterior positions',
        );
      }

      const incisalCompatibleData = replaceTooth(
        createEmptyChart(),
        11,
        'natural',
        [caries('occlusal')],
      );
      expect(validateOdontogramData(incisalCompatibleData).valid).toBe(true);
    });

    it('rejects unknown enum values and missing condition fields', () => {
      const data = createEmptyChart();
      const input = {
        teeth: data.teeth.map((tooth) =>
          tooth.position === 16
            ? {
                ...tooth,
                conditions: [
                  {
                    kind: 'filling',
                    surface: 'incisal',
                    material: 'resin',
                  },
                ],
              }
            : tooth,
        ),
      };

      expect(getInvalidIssues(input)).toEqual([
        { code: 'invalid-shape', path: '$.teeth[2].conditions[0].surface' },
        { code: 'invalid-shape', path: '$.teeth[2].conditions[0].material' },
        { code: 'invalid-shape', path: '$.teeth[2].conditions[0].appearance' },
      ]);
    });
  });

  describe('restorations and visual composition', () => {
    const restorationTypes: readonly RestorationType[] = [
      'crown',
      'inlay',
      'onlay',
      'veneer',
    ];
    const restorationMaterials: readonly RestorationMaterial[] = [
      'emax',
      'gold',
      'gradia',
      'zircon',
      'metal',
      'metal-ceramic',
      'telescope',
      'temporary',
    ];
    const partialMaterials = new Set<RestorationMaterial>([
      'emax',
      'gold',
      'gradia',
      'zircon',
      'temporary',
    ]);

    it.each(
      restorationTypes.flatMap((restorationType) =>
        restorationMaterials.map(
          (material) =>
            [
              restorationType,
              material,
              restorationType === 'crown' || partialMaterials.has(material),
            ] as const,
        ),
      ),
    )(
      'validates %s with %s against the renderer material matrix',
      (restorationType, material, supported) => {
        const data = replaceTooth(createEmptyChart(), 16, 'natural', [
          restoration(restorationType, material),
        ]);

        expect(validateOdontogramData(data).valid).toBe(supported);
      },
    );

    it('allows inlay and veneer on anterior positions but rejects onlay', () => {
      for (const restorationType of ['inlay', 'veneer'] as const) {
        const data = replaceTooth(createEmptyChart(), 11, 'natural', [
          restoration(restorationType),
        ]);
        expect(validateOdontogramData(data).valid).toBe(true);
      }

      const onlay = replaceTooth(createEmptyChart(), 11, 'natural', [
        restoration('onlay'),
      ]);
      expectConditionIssue(
        onlay,
        11,
        'onlay is not renderable for anterior positions',
      );
    });

    it.each(restorationTypes)(
      'rejects surface conditions under a %s',
      (restorationType) => {
        const data = replaceTooth(createEmptyChart(), 16, 'natural', [
          restoration(restorationType),
          caries(),
          filling(),
        ]);

        expectConditionIssue(
          data,
          16,
          'surface conditions cannot be combined with a fixed restoration',
        );
      },
    );

    it('keeps renderer composition separate from clinical eligibility', () => {
      const data = replaceTooth(createEmptyChart(), 16, 'natural', [
        restoration('crown'),
        endodontic(),
        extraction(),
      ]);

      expect(validateOdontogramData(data).valid).toBe(true);
    });

    it('rejects restoration and bridge membership on one tooth', () => {
      let data = withBridge([
        { position: 16, base: 'natural', role: 'abutment' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      data = replaceTooth(data, 16, 'natural', [
        restoration('crown'),
        ...conditionsAt(data, 16),
      ]);

      expectConditionIssue(
        data,
        16,
        'a standalone restoration cannot be combined with bridge membership',
      );
    });

    it('rejects surface conditions on a bridge unit', () => {
      let data = withBridge([
        { position: 16, base: 'natural', role: 'abutment' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      data = replaceTooth(data, 16, 'natural', [
        caries(),
        ...conditionsAt(data, 16),
      ]);

      expectConditionIssue(
        data,
        16,
        'surface conditions cannot be combined with bridge membership',
      );
    });
  });

  describe('base support and cardinality', () => {
    it('accepts empty natural, implant, and missing bases', () => {
      let data = replaceTooth(createEmptyChart(), 16, 'implant', []);
      data = replaceTooth(data, 15, 'missing', []);

      expect(validateOdontogramData(data).valid).toBe(true);
    });

    it('accepts the supported natural condition catalogue', () => {
      const surfaceData = replaceTooth(createEmptyChart(), 16, 'natural', [
        caries('mesial'),
        filling('mesial'),
        endodontic('planned'),
        extraction(),
      ]);
      expect(validateOdontogramData(surfaceData).valid).toBe(true);

      const restorationData = replaceTooth(createEmptyChart(), 16, 'natural', [
        restoration('crown'),
        endodontic(),
        extraction(),
      ]);
      expect(validateOdontogramData(restorationData).valid).toBe(true);
    });

    it('allows only standalone crowns on an implant base', () => {
      const crown = replaceTooth(createEmptyChart(), 16, 'implant', [
        restoration('crown'),
      ]);
      expect(validateOdontogramData(crown).valid).toBe(true);

      for (const condition of [
        caries(),
        filling(),
        endodontic(),
        extraction(),
        restoration('inlay'),
        restoration('onlay'),
        restoration('veneer'),
      ]) {
        const data = replaceTooth(createEmptyChart(), 16, 'implant', [
          condition,
        ]);
        expectConditionIssue(
          data,
          16,
          `${condition.kind} is not supported on an implant base`,
        );
      }
    });

    it('allows only bridge pontic conditions on a missing base', () => {
      for (const condition of [
        caries(),
        filling(),
        endodontic(),
        extraction(),
        restoration('crown'),
      ]) {
        const data = replaceTooth(createEmptyChart(), 16, 'missing', [
          condition,
        ]);
        expectConditionIssue(
          data,
          16,
          `${condition.kind} is not supported on a missing base`,
        );
      }
    });

    it.each([
      [
        'restoration',
        [restoration('crown'), restoration('veneer')],
        'only one restoration is allowed per tooth',
      ],
      [
        'endodontic',
        [endodontic(), endodontic('planned')],
        'only one endodontic condition is allowed per tooth',
      ],
      [
        'extraction',
        [extraction(), extraction()],
        'only one extraction marker is allowed per tooth',
      ],
      [
        'bridge',
        [
          {
            kind: 'bridge',
            bridgeId: 'bridge-1',
            role: 'abutment',
            material: 'zircon',
            appearance: 'existing',
          },
          {
            kind: 'bridge',
            bridgeId: 'bridge-2',
            role: 'abutment',
            material: 'zircon',
            appearance: 'existing',
          },
        ],
        'only one bridge membership is allowed per tooth',
      ],
    ] as const)(
      'rejects duplicate %s whole-tooth conditions',
      (_name, conditions, reason) => {
        const data = replaceTooth(
          createEmptyChart(),
          16,
          'natural',
          conditions,
        );

        expectConditionIssue(data, 16, reason);
      },
    );
  });

  describe('bridge groups', () => {
    it('accepts natural and implant abutments with missing pontics', () => {
      const naturalBridge = withBridge([
        { position: 16, base: 'natural', role: 'abutment' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      expect(validateOdontogramData(naturalBridge).valid).toBe(true);

      const implantBridge = withBridge([
        { position: 16, base: 'implant', role: 'abutment' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      expect(validateOdontogramData(implantBridge).valid).toBe(true);
    });

    it.each([
      [11, 21],
      [41, 31],
    ] as const)(
      'treats FDI midline positions %s and %s as contiguous',
      (left, right) => {
        const data = withBridge([
          { position: left, base: 'natural', role: 'abutment' },
          { position: right, base: 'missing', role: 'pontic' },
        ]);

        expect(validateOdontogramData(data).valid).toBe(true);
      },
    );

    it('rejects bridge roles that disagree with the structural base', () => {
      const naturalPontic = withBridge([
        { position: 16, base: 'natural', role: 'pontic' },
        { position: 15, base: 'natural', role: 'abutment' },
      ]);
      expectConditionIssue(
        naturalPontic,
        16,
        'bridge is not supported on a natural base',
      );

      const missingAbutment = withBridge([
        { position: 16, base: 'missing', role: 'abutment' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      expectConditionIssue(
        missingAbutment,
        16,
        'bridge is not supported on a missing base',
      );

      const implantPontic = withBridge([
        { position: 16, base: 'implant', role: 'pontic' },
        { position: 15, base: 'missing', role: 'pontic' },
      ]);
      expectConditionIssue(
        implantPontic,
        16,
        'bridge is not supported on an implant base',
      );
    });

    it('rejects a bridge group with fewer than two units', () => {
      const data = withBridge([
        { position: 16, base: 'natural', role: 'abutment' },
      ]);

      expectConditionIssue(
        data,
        16,
        'a bridge group must contain at least two units',
      );
    });

    it('rejects bridge groups that cross arches or skip chart positions', () => {
      const crossArch = withBridge([
        { position: 11, base: 'natural', role: 'abutment' },
        { position: 31, base: 'missing', role: 'pontic' },
      ]);
      expectConditionIssue(
        crossArch,
        11,
        'a bridge group must stay within one arch',
      );
      expectConditionIssue(
        crossArch,
        31,
        'a bridge group must stay within one arch',
      );

      const gap = withBridge([
        { position: 16, base: 'natural', role: 'abutment' },
        { position: 14, base: 'missing', role: 'pontic' },
      ]);
      expectConditionIssue(
        gap,
        16,
        'a bridge group must occupy contiguous chart positions',
      );
      expectConditionIssue(
        gap,
        14,
        'a bridge group must occupy contiguous chart positions',
      );
    });

    it('rejects mixed bridge material and appearance', () => {
      const data = withBridge([
        {
          position: 16,
          base: 'natural',
          role: 'abutment',
          material: 'zircon',
          appearance: 'existing',
        },
        {
          position: 15,
          base: 'missing',
          role: 'pontic',
          material: 'gold',
          appearance: 'planned',
        },
      ]);

      expectConditionIssue(data, 16, 'a bridge group must use one material');
      expectConditionIssue(data, 15, 'a bridge group must use one material');
      expectConditionIssue(data, 16, 'a bridge group must use one appearance');
      expectConditionIssue(data, 15, 'a bridge group must use one appearance');
    });

    it('rejects blank bridge identifiers without normalizing input', () => {
      const data = createEmptyChart();
      const input = {
        teeth: data.teeth.map((tooth) =>
          tooth.position === 16
            ? {
                ...tooth,
                conditions: [
                  {
                    kind: 'bridge',
                    bridgeId: '   ',
                    role: 'abutment',
                    material: 'zircon',
                    appearance: 'existing',
                  },
                ],
              }
            : tooth,
        ),
      };

      expect(getInvalidIssues(input)).toContainEqual({
        code: 'invalid-shape',
        path: '$.teeth[2].conditions[0].bridgeId',
      });
    });
  });
});
