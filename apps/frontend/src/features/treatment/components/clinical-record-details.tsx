import type {
  ClinicalDetail,
  ClinicalFindingCode,
  TreatmentActCode,
} from '../model/treatment';
import {
  getClinicalFindingOption,
  getTreatmentActOption,
} from '../model/treatment-catalogue';
import {
  FILLING_MATERIALS,
  RESTORATION_MATERIALS,
} from '../model/treatment-materials';

const humanize = (value: string) => value.toLowerCase().replaceAll('_', ' ');

export function ClinicalRecordDetails({
  code,
  details,
}: {
  readonly code: ClinicalFindingCode | TreatmentActCode;
  readonly details: readonly ClinicalDetail[];
}) {
  const finding = getClinicalFindingOption(code as ClinicalFindingCode);
  const act = getTreatmentActOption(code as TreatmentActCode);
  if (details.length === 0) return null;
  return (
    <dl className="fs-sm text-muted mb-0 mt-1">
      {details.map(({ key, value }) => {
        const field = finding?.optionalFields?.find(
          (candidate) => candidate.key === key,
        );
        const options =
          field?.options ??
          (key === finding?.detailKey ? finding.detailOptions : undefined) ??
          (key === finding?.additionalDetailKey
            ? finding.additionalDetailOptions
            : undefined) ??
          (key === act?.detailKey ? act.detailOptions : undefined);
        const label =
          field?.label ??
          (key === finding?.numericDetail?.key
            ? finding.numericDetail.label
            : humanize(key));
        const material = (
          key === 'FILLING_MATERIAL'
            ? FILLING_MATERIALS
            : key === 'RESTORATION_MATERIAL'
              ? RESTORATION_MATERIALS
              : []
        ).find(([id]) => id === value)?.[1];
        const display =
          options?.find((option) => option.value === value)?.label ??
          material ??
          (typeof value === 'string' ? humanize(value) : String(value));
        return (
          <div key={key}>
            <dt className="d-inline fw-normal">{label}: </dt>
            <dd className="d-inline">{display}</dd>
          </div>
        );
      })}
    </dl>
  );
}
