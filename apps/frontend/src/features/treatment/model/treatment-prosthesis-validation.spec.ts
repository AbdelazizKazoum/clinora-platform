import type { OdontogramData } from '@/features/odontogram';
import { validateProsthesisActForTeeth } from './treatment-prosthesis-validation';

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

describe('validateProsthesisActForTeeth', () => {
  it('allows partial removable denture on missing teeth', () => {
    const data = createMockOdontogramData({ 16: 'missing', 17: 'missing' });
    const result = validateProsthesisActForTeeth(
      'PARTIAL_REMOVABLE_DENTURE',
      [16, 17],
      data,
    );
    expect(result.valid).toBe(true);
  });

  it('allows complete removable denture on missing teeth', () => {
    const data = createMockOdontogramData({ 16: 'missing', 17: 'missing' });
    const result = validateProsthesisActForTeeth(
      'COMPLETE_REMOVABLE_DENTURE',
      [16, 17],
      data,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects partial removable denture on natural teeth', () => {
    const data = createMockOdontogramData({ 16: 'natural' });
    const result = validateProsthesisActForTeeth(
      'PARTIAL_REMOVABLE_DENTURE',
      [16],
      data,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Partial removable denture');
    expect(result.requirement).toContain('16');
  });

  it('rejects complete removable denture on natural teeth', () => {
    const data = createMockOdontogramData({ 16: 'natural' });
    const result = validateProsthesisActForTeeth(
      'COMPLETE_REMOVABLE_DENTURE',
      [16],
      data,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Complete removable denture');
  });

  it('rejects removable denture on implant teeth', () => {
    const data = createMockOdontogramData({ 16: 'implant' });
    const result = validateProsthesisActForTeeth(
      'PARTIAL_REMOVABLE_DENTURE',
      [16],
      data,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('implant');
  });

  it('rejects when selection includes mix of missing and natural teeth', () => {
    const data = createMockOdontogramData({ 16: 'missing', 17: 'natural' });
    const result = validateProsthesisActForTeeth(
      'PARTIAL_REMOVABLE_DENTURE',
      [16, 17],
      data,
    );
    expect(result.valid).toBe(false);
    expect(result.requirement).toContain('17');
  });

  it('rejects when no teeth are selected', () => {
    const data = createMockOdontogramData({});
    const result = validateProsthesisActForTeeth(
      'PARTIAL_REMOVABLE_DENTURE',
      [],
      data,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No teeth selected');
  });

  it('allows other treatment acts without validation', () => {
    const data = createMockOdontogramData({ 16: 'natural' });
    const result = validateProsthesisActForTeeth('CROWN', [16], data);
    expect(result.valid).toBe(true);
  });
});
