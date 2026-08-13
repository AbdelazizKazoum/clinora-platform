import type {
  OdontogramCondition,
  OdontogramData,
  OdontogramTooth,
  ToothPosition,
} from '../model/odontogram';
import { TOOTH_POSITIONS } from '../model/odontogram';
import {
  SADDLE_THICKNESS,
  SADDLE_Y_FRACTION,
  SADDLE_Y_FRACTION_LOWER,
  computeBridgeBars,
  defaultBridgeMaterialColor,
  deriveBridgeSpans,
  type GridRelativeRect,
} from './bridge-layout';

describe('bridge layout', () => {
  it('derives bridge spans by explicit bridge identity before adjacency', () => {
    const result = deriveBridgeSpans(
      chart({
        16: [bridge('bridge-a', 'abutment')],
        15: [bridge('bridge-a', 'pontic')],
        14: [bridge('bridge-b', 'abutment', 'gold')],
        13: [bridge('bridge-b', 'pontic', 'gold')],
      }),
    );

    expect(result.issues).toEqual([]);
    expect(result.spans).toEqual([
      {
        appearance: 'existing',
        arch: 'upper',
        bridgeId: 'bridge-a',
        material: 'zircon',
        positions: [16, 15],
      },
      {
        appearance: 'existing',
        arch: 'upper',
        bridgeId: 'bridge-b',
        material: 'gold',
        positions: [14, 13],
      },
    ]);
  });

  it.each([
    [
      'too-few-units',
      chart({ 16: [bridge('bridge-a', 'abutment')] }),
      ['too-few-units'],
    ],
    [
      'cross-arch',
      chart({
        16: [bridge('bridge-a', 'abutment')],
        46: [bridge('bridge-a', 'pontic')],
      }),
      ['cross-arch'],
    ],
    [
      'non-contiguous',
      chart({
        16: [bridge('bridge-a', 'abutment')],
        14: [bridge('bridge-a', 'pontic')],
      }),
      ['non-contiguous'],
    ],
    [
      'mixed-material',
      chart({
        16: [bridge('bridge-a', 'abutment', 'zircon')],
        15: [bridge('bridge-a', 'pontic', 'gold')],
      }),
      ['mixed-material'],
    ],
    [
      'mixed-appearance',
      chart({
        16: [bridge('bridge-a', 'abutment', 'zircon', 'existing')],
        15: [bridge('bridge-a', 'pontic', 'zircon', 'planned')],
      }),
      ['mixed-appearance'],
    ],
  ] as const)(
    'reports %s groups without producing a span',
    (_name, data, expectedReasons) => {
      const result = deriveBridgeSpans(data);

      expect(result.spans).toEqual([]);
      expect(result.issues.map((issue) => issue.reason)).toEqual(
        expectedReasons,
      );
    },
  );

  it('treats upper midline teeth as contiguous through canonical arch order', () => {
    expect(
      deriveBridgeSpans(
        chart({
          11: [bridge('bridge-a', 'abutment')],
          21: [bridge('bridge-a', 'pontic')],
        }),
      ).spans.map((span) => span.positions),
    ).toEqual([[11, 21]]);
  });

  it('computes upper bridge bars in chart-relative coordinates', () => {
    const [span] = deriveBridgeSpans(
      chart({
        16: [bridge('bridge-a', 'abutment')],
        15: [bridge('bridge-a', 'pontic')],
      }),
    ).spans;
    if (span === undefined) {
      throw new Error('Expected a bridge span');
    }

    expect(
      computeBridgeBars(
        [span],
        rectFor({ 16: rect(10, 20), 15: rect(60, 20) }),
      ),
    ).toEqual([
      {
        appearance: 'existing',
        arch: 'upper',
        bridgeId: 'bridge-a',
        fill: '#feffbf',
        from: 16,
        height: 9,
        to: 15,
        width: 19.599999999999994,
        x: 45.2,
        y: 87.5,
      },
    ]);
  });

  it('uses the mirrored lower saddle fraction for lower arch bars', () => {
    const [span] = deriveBridgeSpans(
      chart({
        46: [bridge('bridge-a', 'abutment', 'gold')],
        45: [bridge('bridge-a', 'pontic', 'gold')],
      }),
    ).spans;
    if (span === undefined) {
      throw new Error('Expected a bridge span');
    }

    const [bar] = computeBridgeBars(
      [span],
      rectFor({ 46: rect(10, 100), 45: rect(60, 100) }),
    );

    expect(bar?.fill).toBe('#ece614');
    expect(bar?.height).toBe(100 * SADDLE_THICKNESS);
    expect(bar?.y).toBe(100 + 100 * SADDLE_Y_FRACTION_LOWER - 4.5);
    expect(bar?.y).not.toBe(100 + 100 * SADDLE_Y_FRACTION - 4.5);
  });

  it('skips bars whose anchor rects are unavailable or non-positive', () => {
    const [span] = deriveBridgeSpans(
      chart({
        16: [bridge('bridge-a', 'abutment')],
        15: [bridge('bridge-a', 'pontic')],
        14: [bridge('bridge-a', 'abutment')],
      }),
    ).spans;
    if (span === undefined) {
      throw new Error('Expected a bridge span');
    }

    expect(
      computeBridgeBars(
        [span],
        rectFor({
          16: rect(10, 20),
          15: { height: 100, width: 0, x: 60, y: 20 },
          14: rect(110, 20),
        }),
      ),
    ).toEqual([]);
  });

  it('keeps the legacy material color table deterministic', () => {
    expect(defaultBridgeMaterialColor('emax')).toBe('#e9e1d2');
    expect(defaultBridgeMaterialColor('metal-ceramic')).toBe('#c9ccd1');
    expect(defaultBridgeMaterialColor('temporary')).toBe('#ffffff');
  });
});

function chart(
  overrides: Partial<
    Record<ToothPosition, readonly OdontogramCondition[]>
  > = {},
): OdontogramData {
  return {
    teeth: TOOTH_POSITIONS.map((position) =>
      tooth(position, overrides[position] ?? []),
    ),
  };
}

function tooth(
  position: ToothPosition,
  conditions: readonly OdontogramCondition[],
): OdontogramTooth {
  return {
    base: conditions.some(
      (condition) => condition.kind === 'bridge' && condition.role === 'pontic',
    )
      ? 'missing'
      : 'natural',
    conditions,
    position,
  };
}

function bridge(
  bridgeId: string,
  role: Extract<OdontogramCondition, { readonly kind: 'bridge' }>['role'],
  material: Extract<
    OdontogramCondition,
    { readonly kind: 'bridge' }
  >['material'] = 'zircon',
  appearance: Extract<
    OdontogramCondition,
    { readonly kind: 'bridge' }
  >['appearance'] = 'existing',
): Extract<OdontogramCondition, { readonly kind: 'bridge' }> {
  return {
    appearance,
    bridgeId,
    kind: 'bridge',
    material,
    role,
  };
}

function rect(x: number, y: number): GridRelativeRect {
  return {
    height: 100,
    width: 40,
    x,
    y,
  };
}

function rectFor(
  rects: Partial<Record<ToothPosition, GridRelativeRect>>,
): (position: ToothPosition) => GridRelativeRect | null {
  return (position) => rects[position] ?? null;
}
