import { Alert, FormControl, FormLabel, FormSelect } from 'react-bootstrap';
import {
  CLINICAL_FINDING_OPTIONS,
  TREATMENT_ACT_OPTIONS,
  getClinicalFindingOption,
  getTreatmentActOption,
} from '../model/treatment-catalogue';
import type {
  ClinicalFindingCode,
  TreatmentActCode,
  PeriodontalSite,
} from '../model/treatment';
import { PERIODONTAL_SITES } from '../model/treatment-inputs';
import {
  FILLING_MATERIALS,
  restorationMaterialOptions,
} from '../model/treatment-materials';

export interface TreatmentEntryFieldsProps {
  readonly canDocument: boolean;
  readonly findingCode: ClinicalFindingCode;
  readonly findingDetail: string;
  readonly findingAdditionalDetail: string;
  readonly findingSearch: string;
  readonly selectedFinding: ReturnType<typeof getClinicalFindingOption>;
  readonly actCode: TreatmentActCode;
  readonly actSearch: string;
  readonly selectedAct: ReturnType<typeof getTreatmentActOption>;
  readonly fillingMaterial: string;
  readonly restorationMaterial: string;
  readonly periodontalSite: PeriodontalSite;
  readonly onFindingCodeChange: (code: ClinicalFindingCode) => void;
  readonly onFindingDetailChange: (value: string) => void;
  readonly onFindingAdditionalDetailChange: (value: string) => void;
  readonly onFindingSearchChange: (value: string) => void;
  readonly onActSearchChange: (value: string) => void;
  readonly onActCodeChange: (code: TreatmentActCode) => void;
  readonly onFillingMaterialChange: (value: string) => void;
  readonly onRestorationMaterialChange: (value: string) => void;
  readonly onPeriodontalSiteChange: (value: PeriodontalSite) => void;
}

export function FindingFormFields(props: TreatmentEntryFieldsProps) {
  return (
    <>
      <FormLabel htmlFor="finding-type">Finding</FormLabel>
      <FormControl
        aria-label="Search findings"
        className="mb-2"
        disabled={!props.canDocument}
        onChange={(event) =>
          props.onFindingSearchChange(event.currentTarget.value)
        }
        placeholder="Search clinical families"
        value={props.findingSearch}
      />
      <FormSelect
        className="mb-3"
        disabled={!props.canDocument}
        id="finding-type"
        onChange={(event) =>
          props.onFindingCodeChange(
            event.currentTarget.value as ClinicalFindingCode,
          )
        }
        value={props.findingCode}
      >
        {groupFindingOptions(props.findingSearch).map(([group, options]) => (
          <optgroup key={group} label={group}>
            {options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </FormSelect>

      {props.selectedFinding?.target === 'periodontal' && (
        <>
          <FormLabel htmlFor="periodontal-site">Periodontal site</FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="periodontal-site"
            onChange={(event) =>
              props.onPeriodontalSiteChange(
                event.currentTarget.value as PeriodontalSite,
              )
            }
            value={props.periodontalSite}
          >
            {PERIODONTAL_SITES.map((site) => (
              <option key={site}>{site}</option>
            ))}
          </FormSelect>
        </>
      )}

      {props.selectedFinding?.detailOptions && (
        <>
          <FormLabel htmlFor="finding-detail">Clinical detail</FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-detail"
            onChange={(event) =>
              props.onFindingDetailChange(event.currentTarget.value)
            }
            value={props.findingDetail}
          >
            {props.selectedFinding.detailOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </>
      )}

      {props.selectedFinding?.numericDetail && (
        <>
          <FormLabel htmlFor="finding-number">
            {props.selectedFinding.numericDetail.label}
          </FormLabel>
          <FormControl
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-number"
            max={props.selectedFinding.numericDetail.max}
            min={props.selectedFinding.numericDetail.min}
            onChange={(event) =>
              props.onFindingDetailChange(event.currentTarget.value)
            }
            type="number"
            value={props.findingDetail}
          />
        </>
      )}

      {props.selectedFinding?.additionalDetailOptions && (
        <>
          <FormLabel htmlFor="finding-additional-detail">
            Additional clinical detail
          </FormLabel>
          <FormSelect
            className="mb-3"
            disabled={!props.canDocument}
            id="finding-additional-detail"
            onChange={(event) =>
              props.onFindingAdditionalDetailChange(event.currentTarget.value)
            }
            value={props.findingAdditionalDetail}
          >
            {props.selectedFinding.additionalDetailOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </>
      )}

      {props.findingCode === 'EXISTING_FIXED_RESTORATION' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="finding-restoration-material"
          label="Restoration material"
          onChange={props.onRestorationMaterialChange}
          options={restorationMaterialOptions(props.findingDetail)}
          value={props.restorationMaterial}
        />
      )}
    </>
  );
}

export function ActFormFields(props: TreatmentEntryFieldsProps) {
  return (
    <>
      <FormLabel htmlFor="act-type">Treatment act</FormLabel>
      <FormControl
        aria-label="Search treatment acts"
        className="mb-2"
        disabled={!props.canDocument}
        onChange={(event) => props.onActSearchChange(event.currentTarget.value)}
        placeholder="Search treatment families"
        value={props.actSearch}
      />
      <FormSelect
        className="mb-3"
        disabled={!props.canDocument}
        id="act-type"
        onChange={(event) =>
          props.onActCodeChange(event.currentTarget.value as TreatmentActCode)
        }
        value={props.actCode}
      >
        {groupActOptions(props.actSearch).map(([group, options]) => (
          <optgroup key={group} label={group}>
            {options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </FormSelect>
      {props.selectedAct?.target === 'bridge' && (
        <Alert className="py-2 fs-sm" variant="info">
          Select a contiguous span with Ctrl/Cmd-click. At least one selected
          position must be missing for a pontic.
        </Alert>
      )}

      {props.selectedAct?.target === 'arch' && (
        <Alert className="py-2 fs-sm" variant="info">
          Select the affected gap or arch units. The prosthesis remains one
          grouped arch-owned act rather than unrelated tooth records.
        </Alert>
      )}
      {props.selectedAct?.requiresMaterial === 'filling' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="act-filling-material"
          label="Filling material"
          onChange={props.onFillingMaterialChange}
          options={FILLING_MATERIALS}
          value={props.fillingMaterial}
        />
      )}
      {props.selectedAct?.requiresMaterial === 'restoration' && (
        <MaterialSelect
          disabled={!props.canDocument}
          id="act-restoration-material"
          label="Restoration material"
          onChange={props.onRestorationMaterialChange}
          options={restorationMaterialOptions(props.actCode)}
          value={props.restorationMaterial}
        />
      )}
      {props.selectedAct?.capability.projection === 'record-only' && (
        <small className="text-muted d-block mb-3">
          This act is stored in the clinical record; the current renderer has no
          dedicated symbol for it yet.
        </small>
      )}
    </>
  );
}

function MaterialSelect({
  disabled,
  id,
  label,
  onChange,
  options,
  value,
}: {
  readonly disabled: boolean;
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly (readonly [string, string])[];
  readonly value: string;
}) {
  return (
    <>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <FormSelect
        className="mb-3"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </FormSelect>
    </>
  );
}

const groupFindingOptions = (search = '') => {
  const query = search.trim().toLocaleLowerCase();
  const groups = new Map<string, typeof CLINICAL_FINDING_OPTIONS>();
  for (const option of CLINICAL_FINDING_OPTIONS) {
    if (
      query &&
      !`${option.label} ${option.code} ${option.group}`
        .toLocaleLowerCase()
        .includes(query)
    ) {
      continue;
    }
    groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
  }
  return [...groups.entries()];
};

const groupActOptions = (search = '') => {
  const query = search.trim().toLocaleLowerCase();
  const groups = new Map<string, typeof TREATMENT_ACT_OPTIONS>();
  for (const option of TREATMENT_ACT_OPTIONS) {
    if (
      query &&
      !`${option.label} ${option.code} ${option.category}`
        .toLocaleLowerCase()
        .includes(query)
    ) {
      continue;
    }
    groups.set(option.category, [
      ...(groups.get(option.category) ?? []),
      option,
    ]);
  }
  return [...groups.entries()];
};
