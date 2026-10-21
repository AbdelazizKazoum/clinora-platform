import type { OdontogramData } from '@/features/odontogram';
import { validateBridgeActForTeeth } from './treatment-bridge-validation';

const createMockOdontogramData = (
  toothStates: Record<number, 'natural' | 'missing' | 'implant'>,
): OdontogramData => ({
  teeth: Array.from({ length: 32 }, (_, i) => {
    const position = i + 11;
    const base = toothStates[position] ?? 'natural';
    return {
      conditions: [],
      base,
      dentition: 'permanent',
      position,
    };
  }),
});

describe('validateBridgeActForTeeth', () => {
  it('allows bridge on adjacent teeth with at least one missing', () => {
    const data = createMockOdontogramData({
      15: 'natural',
      16: 'missing',
      17: 'natural',
    });
    const result = validateBridgeActForTeeth([15, 16, 17], data);
    expect(result.valid).toBe(true);
  });

  it('rejects bridge with less than two teeth', () => {
    const data = createMockOdontogramData({ 16: 'missing' });
    const result = validateBridgeActForTeeth([16], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at least two teeth');
  });

  it('rejects bridge crossing between arches', () => {
    const data = createMockOdontogramData({
      28: 'natural',
      48: 'natural',
      47: 'missing',
    });
    const result = validateBridgeActForTeeth([28, 48, 47], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cannot cross between upper and lower');
  });

  it('rejects bridge with non-contiguous teeth', () => {
    const data = createMockOdontogramData({
      15: 'natural',
      17: 'missing',
    });
    const result = validateBridgeActForTeeth([15, 17], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('contiguous span');
  });

  it('rejects bridge when all teeth are present (no missing)', () => {
    const data = createMockOdontogramData({
      15: 'natural',
      16: 'natural',
      17: 'natural',
    });
    const result = validateBridgeActForTeeth([15, 16, 17], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at least one missing tooth');
  });

  it('rejects bridge when all teeth are missing (no abutment)', () => {
    const data = createMockOdontogramData({
      15: 'missing',
      16: 'missing',
      17: 'missing',
    });
    const result = validateBridgeActForTeeth([15, 16, 17], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at least one natural tooth');
  });

  it('rejects bridge with implant teeth in the span', () => {
    const data = createMockOdontogramData({
      15: 'natural',
      16: 'implant',
      17: 'missing',
    });
    const result = validateBridgeActForTeeth([15, 16, 17], data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cannot include implant');
  });

  it('allows bridge with multiple missing teeth and natural abutments', () => {
    const data = createMockOdontogramData({
      14: 'natural',
      15: 'missing',
      16: 'missing',
      17: 'natural',
    });
    const result = validateBridgeActForTeeth([14, 15, 16, 17], data);
    expect(result.valid).toBe(true);
  });
});
