import type {
  OdontogramData,
  OdontogramTooth,
  ToothPosition,
} from '@/features/odontogram';

export const hasExistingCrown = (
  tooth: Pick<OdontogramTooth, 'conditions'>,
): boolean =>
  tooth.conditions.some(
    (condition) =>
      condition.kind === 'restoration' &&
      condition.restoration === 'crown' &&
      condition.appearance === 'existing',
  );

export type CrownReplacementValidationResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly reason: string;
      readonly requirement: string;
    };

export const validateCrownReplacementForTeeth = (
  selectedTeeth: readonly ToothPosition[],
  data: OdontogramData,
): CrownReplacementValidationResult => {
  const teethWithoutCrowns = selectedTeeth.filter((position) => {
    const tooth = data.teeth.find(
      (candidate) => candidate.position === position,
    );
    return !tooth || !hasExistingCrown(tooth);
  });

  if (teethWithoutCrowns.length > 0) {
    return {
      valid: false,
      reason:
        'Crown replacement requires an existing crown on every selected tooth.',
      requirement: `No existing crown is documented on teeth ${teethWithoutCrowns.join(', ')}. If a crown is already present, record and confirm Findings → Existing fixed restoration → Crown for each tooth first. If the tooth has no crown, choose Crown to plan its first crown.`,
    };
  }

  return { valid: true };
};
