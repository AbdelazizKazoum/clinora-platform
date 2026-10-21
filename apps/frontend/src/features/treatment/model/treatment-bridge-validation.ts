import {
  TOOTH_POSITIONS,
  type OdontogramData,
  type ToothPosition,
} from '@/features/odontogram';

export interface BridgeValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly requirement?: string;
}

export const validateBridgeActForTeeth = (
  selectedTeeth: readonly ToothPosition[],
  odontogramData: OdontogramData,
): BridgeValidationResult => {
  if (selectedTeeth.length < 2) {
    return {
      valid: false,
      reason: 'Fixed bridge requires at least two teeth.',
      requirement:
        'A bridge spans multiple teeth to replace missing teeth. Please hold Ctrl/Cmd and click to select at least two adjacent teeth.',
    };
  }

  const indices = selectedTeeth
    .map((position) => TOOTH_POSITIONS.indexOf(position))
    .sort((left, right) => left - right);

  const sameArch =
    indices.every((index) => index < 16) ||
    indices.every((index) => index >= 16);

  if (!sameArch) {
    return {
      valid: false,
      reason: 'A bridge cannot cross between upper and lower arches.',
      requirement:
        'All selected teeth must be in the same arch (either all upper or all lower). Please select teeth from only one arch.',
    };
  }

  const isContiguous = indices.every(
    (index, offset) => offset === 0 || index === indices[offset - 1] + 1,
  );

  if (!isContiguous) {
    return {
      valid: false,
      reason: 'Bridge teeth must form one contiguous span.',
      requirement:
        'Please select adjacent teeth without gaps. A bridge cannot span across non-adjacent teeth.',
    };
  }

  const naturalTeeth: ToothPosition[] = [];
  const missingTeeth: ToothPosition[] = [];
  const implantTeeth: ToothPosition[] = [];

  for (const position of selectedTeeth) {
    const tooth = odontogramData.teeth.find((t) => t.position === position);
    if (!tooth) continue;

    if (tooth.base === 'natural') {
      naturalTeeth.push(position);
    } else if (tooth.base === 'missing') {
      missingTeeth.push(position);
    } else if (tooth.base === 'implant') {
      implantTeeth.push(position);
    }
  }

  if (missingTeeth.length === 0) {
    return {
      valid: false,
      reason: 'A bridge requires at least one missing tooth in the span.',
      requirement: `Selected teeth ${selectedTeeth.join(', ')} are all present. A bridge replaces missing teeth using adjacent teeth as abutments. Please mark one of the teeth as missing first (e.g., extraction planned or completed).`,
    };
  }

  if (naturalTeeth.length === 0 && missingTeeth.length > 0) {
    return {
      valid: false,
      reason: 'A bridge requires at least one natural tooth as an abutment.',
      requirement: `Selected teeth ${selectedTeeth.join(', ')} are all missing. A bridge needs at least one natural tooth to anchor it. Please include at least one natural tooth in the selection.`,
    };
  }

  if (implantTeeth.length > 0) {
    return {
      valid: false,
      reason: 'A bridge cannot include implant teeth in the span.',
      requirement: `Selected tooth/teeth ${implantTeeth.join(', ')} ${implantTeeth.length === 1 ? 'is an implant' : 'are implants'}. Bridges are designed for natural teeth abutments. For implant-supported prostheses, use implant overdenture or bar attachment instead.`,
    };
  }

  return { valid: true };
};
