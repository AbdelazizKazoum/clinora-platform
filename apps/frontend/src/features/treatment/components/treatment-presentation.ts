import type {
  TreatmentVisit,
  ToothSurface as TreatmentSurface,
} from '../model/treatment';

export const formatTarget = (
  teeth: readonly number[],
  surfaces: readonly TreatmentSurface[],
) =>
  `Tooth ${teeth.join(', ')}${surfaces.length > 0 ? ` · ${surfaces.join(', ')}` : ''}`;

export const visitStatusVariant = (status: TreatmentVisit['status']) =>
  status === 'COMPLETED'
    ? 'success'
    : status === 'AWAITING_REVIEW'
      ? 'warning'
      : status === 'CANCELLED'
        ? 'danger'
        : 'primary';

export const recordStatusVariant = (status: string) =>
  status === 'COMPLETED' || status === 'CONFIRMED'
    ? 'success'
    : status === 'DRAFT'
      ? 'warning'
      : status === 'CANCELLED' || status === 'ENTERED_IN_ERROR'
        ? 'danger'
        : 'primary';
