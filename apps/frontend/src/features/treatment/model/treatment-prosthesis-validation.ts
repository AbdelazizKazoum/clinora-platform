import type { OdontogramData, ToothPosition } from '@/features/odontogram';
import type { TreatmentActCode } from './treatment';

export interface ProsthesisValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly requirement?: string;
}

const REMOVABLE_DENTURE_ACT_CODES: ReadonlySet<TreatmentActCode> = new Set([
  'PARTIAL_REMOVABLE_DENTURE',
  'COMPLETE_REMOVABLE_DENTURE',
]);

export const validateProsthesisActForTeeth = (
  actCode: TreatmentActCode,
  selectedTeeth: readonly ToothPosition[],
  odontogramData: OdontogramData,
): ProsthesisValidationResult => {
  if (!REMOVABLE_DENTURE_ACT_CODES.has(actCode)) {
    return { valid: true };
  }

  if (selectedTeeth.length === 0) {
    return {
      valid: false,
      reason: 'No teeth selected',
      requirement: 'Please select at least one tooth position.',
    };
  }

  const missingTeeth: ToothPosition[] = [];
  const naturalTeeth: ToothPosition[] = [];
  const implantTeeth: ToothPosition[] = [];

  for (const position of selectedTeeth) {
    const tooth = odontogramData.teeth.find((t) => t.position === position);
    if (!tooth) continue;

    if (tooth.base === 'missing') {
      missingTeeth.push(position);
    } else if (tooth.base === 'implant') {
      implantTeeth.push(position);
    } else if (tooth.base === 'natural') {
      naturalTeeth.push(position);
    }
  }

  if (naturalTeeth.length > 0) {
    const actLabel =
      actCode === 'PARTIAL_REMOVABLE_DENTURE'
        ? 'Partial removable denture'
        : 'Complete removable denture';
    return {
      valid: false,
      reason: `${actLabel} can only be planned on missing teeth.`,
      requirement: `Selected tooth/teeth ${naturalTeeth.join(', ')} ${naturalTeeth.length === 1 ? 'is' : 'are'} still present. ${actLabel} requires the tooth to be extracted or already missing.`,
    };
  }

  if (implantTeeth.length > 0) {
    return {
      valid: false,
      reason: 'Removable dentures cannot be placed on implant teeth.',
      requirement: `Selected tooth/teeth ${implantTeeth.join(', ')} ${implantTeeth.length === 1 ? 'is an implant' : 'are implants'}. Removable dentures are only for missing tooth spaces.`,
    };
  }

  return { valid: true };
};
