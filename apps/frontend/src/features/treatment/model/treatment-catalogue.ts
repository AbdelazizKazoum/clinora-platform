import {
  CLINICAL_FINDING_CAPABILITIES,
  TREATMENT_ACT_CAPABILITIES,
  type TreatmentCapability,
} from './treatment-capabilities';
import type { ClinicalFindingCode, TreatmentActCode } from './treatment';

export type TreatmentCatalogueTarget =
  | 'tooth'
  | 'surface'
  | 'arch'
  | 'bridge'
  | 'periodontal'
  | 'index-surface'
  | 'furcation'
  | 'tooth-region';

export interface TreatmentActOption {
  readonly code: TreatmentActCode;
  readonly label: string;
  readonly category:
    | 'Preventive'
    | 'Restorative'
    | 'Endodontic'
    | 'Surgery'
    | 'Implant'
    | 'Prosthodontic'
    | 'Orthodontic';
  readonly target: TreatmentCatalogueTarget;
  readonly requiresMaterial?: 'filling' | 'restoration';
  readonly capability: TreatmentCapability;
}

type TreatmentActOptionDraft = Omit<TreatmentActOption, 'capability'>;

const TREATMENT_ACT_OPTION_DRAFTS: readonly TreatmentActOptionDraft[] = [
  {
    code: 'FISSURE_SEALING',
    label: 'Fissure sealing',
    category: 'Preventive',
    target: 'surface',
  },
  {
    code: 'DIRECT_FILLING',
    label: 'Direct filling',
    category: 'Restorative',
    target: 'surface',
    requiresMaterial: 'filling',
  },
  {
    code: 'CROWN',
    label: 'Crown',
    category: 'Restorative',
    target: 'tooth',
    requiresMaterial: 'restoration',
  },
  {
    code: 'INLAY',
    label: 'Inlay',
    category: 'Restorative',
    target: 'tooth',
    requiresMaterial: 'restoration',
  },
  {
    code: 'ONLAY',
    label: 'Onlay',
    category: 'Restorative',
    target: 'surface',
    requiresMaterial: 'restoration',
  },
  {
    code: 'VENEER',
    label: 'Veneer',
    category: 'Restorative',
    target: 'tooth',
    requiresMaterial: 'restoration',
  },
  {
    code: 'CROWN_REPLACEMENT',
    label: 'Crown replacement',
    category: 'Restorative',
    target: 'tooth',
    requiresMaterial: 'restoration',
  },
  {
    code: 'ROOT_CANAL_MEDICATION',
    label: 'Root canal medication',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'ROOT_CANAL_FILLING',
    label: 'Root canal filling',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'ROOT_CANAL_REPAIR',
    label: 'Incomplete root canal correction',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'GLASS_FIBER_POST',
    label: 'Glass fiber post',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'METAL_POST',
    label: 'Metal post',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'APICOECTOMY',
    label: 'Apicoectomy / root resection',
    category: 'Endodontic',
    target: 'tooth',
  },
  {
    code: 'PARAPULPAL_PIN',
    label: 'Parapulpal pin',
    category: 'Restorative',
    target: 'tooth',
  },
  {
    code: 'EXTRACTION',
    label: 'Extraction',
    category: 'Surgery',
    target: 'tooth',
  },
  {
    code: 'IMPLANT_PLACEMENT',
    label: 'Implant placement',
    category: 'Implant',
    target: 'tooth',
  },
  {
    code: 'HEALING_ABUTMENT',
    label: 'Healing abutment',
    category: 'Implant',
    target: 'tooth',
  },
  {
    code: 'BRIDGE',
    label: 'Fixed bridge',
    category: 'Prosthodontic',
    target: 'bridge',
    requiresMaterial: 'restoration',
  },
  {
    code: 'LOCATOR_ATTACHMENT',
    label: 'Locator attachment',
    category: 'Prosthodontic',
    target: 'tooth',
  },
  {
    code: 'LOCATOR_OVERDENTURE',
    label: 'Locator overdenture',
    category: 'Prosthodontic',
    target: 'arch',
  },
  {
    code: 'BAR_ATTACHMENT',
    label: 'Bar attachment',
    category: 'Prosthodontic',
    target: 'tooth',
  },
  {
    code: 'BAR_OVERDENTURE',
    label: 'Bar overdenture',
    category: 'Prosthodontic',
    target: 'arch',
  },
  {
    code: 'PARTIAL_REMOVABLE_DENTURE',
    label: 'Partial removable denture',
    category: 'Prosthodontic',
    target: 'arch',
  },
  {
    code: 'COMPLETE_REMOVABLE_DENTURE',
    label: 'Complete removable denture',
    category: 'Prosthodontic',
    target: 'arch',
  },
  {
    code: 'ORTHODONTIC_APPLIANCE',
    label: 'Orthodontic appliance',
    category: 'Orthodontic',
    target: 'tooth',
  },
];

export const TREATMENT_ACT_OPTIONS: readonly TreatmentActOption[] =
  TREATMENT_ACT_OPTION_DRAFTS.map((option) => ({
    ...option,
    capability: TREATMENT_ACT_CAPABILITIES[option.code],
  }));

export interface ClinicalFindingOption {
  readonly code: ClinicalFindingCode;
  readonly label: string;
  readonly group:
    | 'Status'
    | 'Caries & restorations'
    | 'Endodontic'
    | 'Periodontal'
    | 'Other';
  readonly target: TreatmentCatalogueTarget;
  readonly detailKey?: string;
  readonly detailOptions?: readonly TreatmentDetailOption[];
  readonly numericDetail?: {
    readonly key: string;
    readonly label: string;
    readonly min: number;
    readonly max: number;
  };
  readonly capability: TreatmentCapability;
}

export interface TreatmentDetailOption {
  readonly label: string;
  readonly value: string;
  readonly capability: TreatmentCapability;
}

const options = (...values: readonly [string, string][]) =>
  values.map(([value, label]) => ({ label, value }));

type ClinicalFindingOptionDraft = Omit<ClinicalFindingOption, 'capability' | 'detailOptions'> & {
  readonly detailOptions?: readonly Omit<TreatmentDetailOption, 'capability'>[];
};

const CLINICAL_FINDING_OPTION_DRAFTS: readonly ClinicalFindingOptionDraft[] = [
  {
    code: 'TOOTH_STATE',
    label: 'Tooth state',
    group: 'Status',
    target: 'tooth',
    detailKey: 'TOOTH_STATE',
    detailOptions: options(
      ['NATURAL', 'Permanent tooth'],
      ['MISSING', 'Missing tooth'],
      ['IMPLANT', 'Implant'],
      ['PRIMARY', 'Primary / deciduous tooth'],
      ['UNDER_GUM', 'Tooth under gum'],
      ['MISSING_AFTER_EXTRACTION', 'Missing after extraction'],
    ),
  },
  {
    code: 'TOOTH_SUBSTRATE',
    label: 'Tooth substrate',
    group: 'Status',
    target: 'tooth',
    detailKey: 'TOOTH_SUBSTRATE',
    detailOptions: options(
      ['NATURAL', 'Natural'],
      ['RADIX', 'Root remnant'],
      ['BROKEN', 'Broken tooth'],
      ['CROWNPREP', 'Crown preparation'],
    ),
  },
  {
    code: 'CARIES',
    label: 'Dental caries',
    group: 'Caries & restorations',
    target: 'surface',
    numericDetail: {
      key: 'ICDAS_CARS_SEVERITY',
      label: 'ICDAS / CARS severity',
      min: 1,
      max: 6,
    },
  },
  {
    code: 'ROOT_CARIES',
    label: 'Root caries',
    group: 'Caries & restorations',
    target: 'tooth',
    detailKey: 'ROOT_CARIES_STATE',
    detailOptions: options(
      ['ACTIVE', 'Active'],
      ['ARRESTED', 'Arrested'],
      ['ACTIVE_CAVITATED', 'Active cavitated'],
    ),
  },
  {
    code: 'EXISTING_FILLING',
    label: 'Existing filling',
    group: 'Caries & restorations',
    target: 'surface',
    detailKey: 'FILLING_MATERIAL',
    detailOptions: options(
      ['AMALGAM', 'Amalgam'],
      ['COMPOSITE', 'Composite'],
      ['GIC', 'Glass ionomer'],
      ['TEMPORARY', 'Temporary'],
    ),
  },
  {
    code: 'EXISTING_FIXED_RESTORATION',
    label: 'Existing fixed restoration',
    group: 'Caries & restorations',
    target: 'tooth',
    detailKey: 'RESTORATION_TYPE',
    detailOptions: options(
      ['CROWN', 'Crown'],
      ['INLAY', 'Inlay'],
      ['ONLAY', 'Onlay'],
      ['VENEER', 'Veneer'],
    ),
  },
  {
    code: 'CROWN_LEAKAGE',
    label: 'Crown marginal leakage',
    group: 'Caries & restorations',
    target: 'tooth',
  },
  {
    code: 'EXISTING_ENDODONTIC_STATE',
    label: 'Existing endodontic treatment',
    group: 'Endodontic',
    target: 'tooth',
    detailKey: 'ENDODONTIC_STATE',
    detailOptions: options(
      ['MEDICATION', 'Medication'],
      ['ROOT_CANAL_FILLING', 'Root canal filling'],
      ['INCOMPLETE', 'Incomplete filling'],
      ['GLASS_FIBER_POST', 'Glass fiber post'],
      ['METAL_POST', 'Metal post'],
    ),
  },
  {
    code: 'PULP_DIAGNOSIS',
    label: 'Pulp diagnosis',
    group: 'Endodontic',
    target: 'tooth',
    detailKey: 'PULP_DIAGNOSIS',
    detailOptions: options(
      ['NORMAL', 'Normal pulp'],
      ['REVERSIBLE_PULPITIS', 'Reversible pulpitis'],
      ['IRREVERSIBLE_PULPITIS', 'Irreversible pulpitis'],
      ['NECROSIS', 'Pulp necrosis'],
    ),
  },
  {
    code: 'APICAL_DIAGNOSIS',
    label: 'Apical diagnosis',
    group: 'Endodontic',
    target: 'tooth',
    detailKey: 'APICAL_DIAGNOSIS',
    detailOptions: options(
      ['NORMAL', 'No apical pathology'],
      ['SYMPTOMATIC_APICAL_PERIODONTITIS', 'Symptomatic apical periodontitis'],
      [
        'ASYMPTOMATIC_APICAL_PERIODONTITIS',
        'Asymptomatic apical periodontitis',
      ],
      ['ACUTE_APICAL_ABSCESS', 'Acute apical abscess'],
      ['CHRONIC_APICAL_ABSCESS', 'Chronic apical abscess'],
      ['CONDENSING_OSTEITIS', 'Condensing osteitis'],
    ),
  },
  {
    code: 'PERIAPICAL_LESION',
    label: 'Periapical lesion',
    group: 'Endodontic',
    target: 'tooth',
    detailKey: 'PERIAPICAL_LESION_TYPE',
    detailOptions: options(
      ['GRANULOMA', 'Granuloma'],
      ['CYST', 'Cyst'],
      ['ABSCESS', 'Abscess'],
    ),
  },
  {
    code: 'ROOT_RESORPTION',
    label: 'Root resorption',
    group: 'Endodontic',
    target: 'tooth',
    detailKey: 'ROOT_RESORPTION_TYPE',
    detailOptions: options(
      ['INTERNAL', 'Internal'],
      ['EXTERNAL_CERVICAL', 'External cervical'],
    ),
  },
  {
    code: 'CALCULUS',
    label: 'Calculus',
    group: 'Periodontal',
    target: 'tooth',
  },
  {
    code: 'MOBILITY',
    label: 'Mobility',
    group: 'Periodontal',
    target: 'tooth',
    detailKey: 'MOBILITY_GRADE',
    detailOptions: options(
      ['1', 'Grade I'],
      ['2', 'Grade II'],
      ['3', 'Grade III'],
    ),
  },
  {
    code: 'PERIODONTAL_INVOLVEMENT',
    label: 'Periodontal involvement',
    group: 'Periodontal',
    target: 'tooth',
  },
  {
    code: 'PERIODONTAL_MEASUREMENT',
    label: 'Periodontal probing',
    group: 'Periodontal',
    target: 'periodontal',
    numericDetail: {
      key: 'PROBING_DEPTH_MM',
      label: 'Probing depth (mm)',
      min: 1,
      max: 15,
    },
  },
  {
    code: 'FURCATION_INVOLVEMENT',
    label: 'Furcation involvement',
    group: 'Periodontal',
    target: 'tooth',
    detailKey: 'FURCATION_GRADE',
    detailOptions: options(
      ['1', 'Grade I'],
      ['2', 'Grade II'],
      ['3', 'Grade III'],
      ['4', 'Grade IV'],
    ),
  },
  {
    code: 'PLAQUE_FINDING',
    label: 'Plaque',
    group: 'Periodontal',
    target: 'surface',
  },
  {
    code: 'GINGIVAL_FINDING',
    label: 'Gingival finding',
    group: 'Periodontal',
    target: 'surface',
  },
  {
    code: 'EXISTING_PROSTHESIS',
    label: 'Existing prosthesis / attachment',
    group: 'Other',
    target: 'tooth',
    detailKey: 'PROSTHESIS_TYPE',
    detailOptions: options(
      ['HEALING_ABUTMENT', 'Healing abutment'],
      ['LOCATOR', 'Locator attachment'],
      ['LOCATOR_DENTURE', 'Locator overdenture'],
      ['BAR', 'Bar attachment'],
      ['BAR_DENTURE', 'Bar overdenture'],
      ['REMOVABLE_PARTIAL', 'Partial removable denture'],
      ['REMOVABLE_FULL', 'Complete removable denture'],
    ),
  },
  {
    code: 'CONTACT_POINT_DEFECT',
    label: 'Contact point defect',
    group: 'Other',
    target: 'surface',
  },
  {
    code: 'TOOTH_FRACTURE',
    label: 'Tooth fracture',
    group: 'Other',
    target: 'tooth-region',
  },
  {
    code: 'EXTRACTION_WOUND',
    label: 'Extraction wound',
    group: 'Other',
    target: 'tooth',
  },
  {
    code: 'TOOTH_WEAR',
    label: 'Tooth wear',
    group: 'Other',
    target: 'surface',
    detailKey: 'WEAR_TYPE',
    detailOptions: options(
      ['ATTRITION', 'Attrition'],
      ['ABRASION', 'Abrasion'],
      ['ABFRACTION', 'Abfraction'],
      ['EROSION', 'Erosion'],
    ),
  },
  {
    code: 'DISCOLORATION',
    label: 'Discoloration',
    group: 'Other',
    target: 'tooth',
    detailKey: 'DISCOLORATION_TYPE',
    detailOptions: options(
      ['TETRACYCLINE', 'Tetracycline'],
      ['FLUOROSIS', 'Fluorosis'],
      ['NONVITAL', 'Non-vital'],
      ['EXTRINSIC', 'Extrinsic'],
      ['OTHER', 'Other'],
    ),
  },
  {
    code: 'ORTHODONTIC_STATE',
    label: 'Orthodontic state',
    group: 'Other',
    target: 'tooth',
    detailKey: 'ORTHODONTIC_STATE',
    detailOptions: options(
      ['BRACKET', 'Bracket'],
      ['BAND', 'Band'],
      ['MESIAL_DRIFT', 'Mesial drift'],
      ['DISTAL_DRIFT', 'Distal drift'],
      ['EXTRUSION', 'Extrusion'],
      ['INTRUSION', 'Intrusion'],
      ['ROTATION', 'Rotation'],
    ),
  },
  {
    code: 'PERI_IMPLANT_STATUS',
    label: 'Peri-implant status',
    group: 'Other',
    target: 'tooth',
    detailKey: 'PERI_IMPLANT_STATE',
    detailOptions: options(
      ['HEALTHY', 'Healthy'],
      ['MUCOSITIS', 'Mucositis'],
      ['MILD', 'Peri-implantitis — mild'],
      ['MODERATE', 'Peri-implantitis — moderate'],
      ['SEVERE', 'Peri-implantitis — severe'],
    ),
  },
];

export const CLINICAL_FINDING_OPTIONS: readonly ClinicalFindingOption[] =
  CLINICAL_FINDING_OPTION_DRAFTS.map(
    (option) => ({
      ...option,
      capability: CLINICAL_FINDING_CAPABILITIES[option.code],
      detailOptions: option.detailOptions?.map((detail) => ({
        ...detail,
        capability: {
          ...CLINICAL_FINDING_CAPABILITIES[option.code],
          projection:
            CLINICAL_FINDING_CAPABILITIES[option.code].subtypeSupport?.[
              detail.value
            ] ?? CLINICAL_FINDING_CAPABILITIES[option.code].projection,
        },
      })),
    }),
  );

export const getTreatmentActOption = (code: TreatmentActCode) =>
  TREATMENT_ACT_OPTIONS.find((option) => option.code === code);

export const getClinicalFindingOption = (code: ClinicalFindingCode) =>
  CLINICAL_FINDING_OPTIONS.find((option) => option.code === code);
