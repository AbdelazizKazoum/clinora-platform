/** Adapted from the reviewed legacy diagnostic vocabulary; no diagnosis is inferred. */
export const LATIN_PULP_OPTIONS = [
  { value: 'PULPA_SANA', label: 'Pulpa sana', parentValue: 'NORMAL' },
  {
    value: 'HYPERAEMIA_PULPAE',
    label: 'Hyperaemia pulpae',
    parentValue: 'REVERSIBLE_PULPITIS',
  },
  {
    value: 'PULPITIS_ACUTA_SEROSA',
    label: 'Pulpitis acuta serosa',
    parentValue: 'IRREVERSIBLE_PULPITIS',
  },
  {
    value: 'PULPITIS_ACUTA_PURULENTA',
    label: 'Pulpitis acuta purulenta',
    parentValue: 'IRREVERSIBLE_PULPITIS',
  },
  {
    value: 'PULPITIS_CHRONICA_CLAUSA',
    label: 'Pulpitis chronica clausa',
    parentValue: 'IRREVERSIBLE_PULPITIS',
  },
  {
    value: 'PULPITIS_CHRONICA_ULCEROSA',
    label: 'Pulpitis chronica ulcerosa (aperta)',
    parentValue: 'IRREVERSIBLE_PULPITIS',
  },
  {
    value: 'PULPITIS_CHRONICA_HYPERPLASTICA',
    label: 'Pulpitis chronica hyperplastica (pulpa-polyp)',
    parentValue: 'IRREVERSIBLE_PULPITIS',
  },
  {
    value: 'NECROSIS_PULPAE',
    label: 'Necrosis pulpae',
    parentValue: 'NECROSIS',
  },
  {
    value: 'GANGRAENA_PULPAE',
    label: 'Gangraena pulpae',
    parentValue: 'NECROSIS',
  },
] as const;

export interface OptionalClinicalField {
  readonly key: string;
  readonly label: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    readonly parentValue?: string;
  }[];
}
