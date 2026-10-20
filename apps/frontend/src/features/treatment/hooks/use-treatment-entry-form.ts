'use client';
import { useState } from 'react';
import type {
  OdontogramSelection,
  OdontogramData,
  ToothSurface,
} from '@/features/odontogram';
import {
  getClinicalFindingOption,
  getClinicalFindingTarget,
  getTreatmentActOption,
} from '../model/treatment-catalogue';
import type {
  ClinicalDetail,
  ClinicalFindingCode,
  PeriodontalSite,
  TreatmentActCode,
} from '../model/treatment';
import {
  buildTarget,
  requiresSurface,
  validateBridgeSelection,
} from '../model/treatment-targets';
import {
  isPartialRestoration,
  isPartialRestorationMaterial,
} from '../model/treatment-materials';
import type {
  TreatmentFeedback,
  TreatmentVisitActions,
} from './use-local-treatment-visit';

/** Unsaved form and chart selection state, independent of visit persistence. */
export function useTreatmentEntryForm({
  actions,
  data,
  showFeedback,
}: {
  readonly actions: Pick<TreatmentVisitActions, 'recordAct' | 'recordFinding'>;
  readonly data: OdontogramData;
  readonly showFeedback: (feedback: TreatmentFeedback | null) => void;
}) {
  const [selection, setSelection] = useState<OdontogramSelection>({
    activeToothPosition: 16,
    selectedToothPositions: [16],
  });
  const [surfaces, setSurfaces] = useState<readonly ToothSurface[]>([
    'occlusal',
  ]);
  const [findingCode, setFindingCode] = useState<ClinicalFindingCode>('CARIES');
  const [findingSearch, setFindingSearch] = useState('');
  const [findingDetail, setFindingDetail] = useState('4');
  const [findingAdditionalDetail, setFindingAdditionalDetail] = useState('');
  const [findingOptionalDetails, setFindingOptionalDetails] = useState<
    Readonly<Record<string, string>>
  >({});
  const [actDetail, setActDetail] = useState('BRACKET');
  const [periodontalSite, setPeriodontalSite] = useState<PeriodontalSite>('B');
  const [actCode, setActCode] = useState<TreatmentActCode>('DIRECT_FILLING');
  const [actSearch, setActSearch] = useState('');
  const [fillingMaterial, setFillingMaterial] = useState('COMPOSITE');
  const [restorationMaterial, setRestorationMaterial] = useState('ZIRCON');
  const [note, setNote] = useState('');
  const activeTooth = selection.activeToothPosition;
  const selectedFinding = getClinicalFindingOption(findingCode);
  const selectedAct = getTreatmentActOption(actCode);
  const addFinding = () => {
    if (!activeTooth || !selectedFinding) {
      return showFeedback({
        message: 'Select a tooth first.',
        variant: 'warning',
      });
    }
    const findingTarget = getClinicalFindingTarget(findingCode, findingDetail);
    if (requiresSurface(findingTarget) && surfaces.length === 0) {
      return showFeedback({
        message: 'Select at least one tooth surface.',
        variant: 'warning',
      });
    }

    const details: ClinicalDetail[] = [];
    for (const field of selectedFinding.optionalFields ?? []) {
      const value = findingOptionalDetails[field.key];
      if (value) details.push({ key: field.key, value });
    }
    if (selectedFinding.detailKey && findingDetail) {
      details.push({ key: selectedFinding.detailKey, value: findingDetail });
    }
    if (selectedFinding.numericDetail) {
      details.push({
        key: selectedFinding.numericDetail.key,
        value: Number(findingDetail),
      });
    }
    if (findingCode === 'EXISTING_FIXED_RESTORATION') {
      details.push({ key: 'RESTORATION_MATERIAL', value: restorationMaterial });
    }
    if (selectedFinding.additionalDetailKey && findingAdditionalDetail) {
      details.push({
        key: selectedFinding.additionalDetailKey,
        value: findingAdditionalDetail,
      });
    }

    if (findingTarget === 'bridge') {
      const error = validateBridgeSelection(
        selection.selectedToothPositions,
        data,
      );
      if (error) return showFeedback({ message: error, variant: 'warning' });
    }
    actions.recordFinding({
      code: findingCode,
      details,
      note: note.trim() || null,
      target: buildTarget(
        findingTarget,
        findingTarget === 'bridge'
          ? selection.selectedToothPositions
          : [activeTooth],
        surfaces,
        periodontalSite,
      ),
    });
    setNote('');
  };

  const addAct = () => {
    if (!selectedAct || selection.selectedToothPositions.length === 0) {
      return showFeedback({
        message: 'Select the target tooth or teeth first.',
        variant: 'warning',
      });
    }
    if (requiresSurface(selectedAct.target) && surfaces.length === 0) {
      return showFeedback({
        message: 'Select at least one tooth surface.',
        variant: 'warning',
      });
    }
    if (selectedAct.target === 'bridge') {
      const bridgeError = validateBridgeSelection(
        selection.selectedToothPositions,
        data,
      );
      if (bridgeError)
        return showFeedback({ message: bridgeError, variant: 'warning' });
    }

    const details: ClinicalDetail[] = [];
    if (selectedAct.detailKey)
      details.push({ key: selectedAct.detailKey, value: actDetail });
    if (selectedAct.requiresMaterial === 'filling') {
      details.push({ key: 'FILLING_MATERIAL', value: fillingMaterial });
    }
    if (selectedAct.requiresMaterial === 'restoration') {
      details.push({ key: 'RESTORATION_MATERIAL', value: restorationMaterial });
    }

    actions.recordAct({
      code: actCode,
      details,
      note: note.trim() || null,
      target: buildTarget(
        selectedAct.target,
        selection.selectedToothPositions,
        surfaces,
        periodontalSite,
      ),
    });
    setNote('');
  };

  const selectFindingCode = (code: ClinicalFindingCode) => {
    setFindingOptionalDetails({});
    setFindingCode(code);
    setFindingSearch('');
    const option = getClinicalFindingOption(code);
    setFindingDetail(
      option?.numericDetail
        ? String(option.numericDetail.min)
        : (option?.detailOptions?.[0]?.value ?? ''),
    );
    setFindingAdditionalDetail(
      option?.additionalDetailOptions?.[0]?.value ?? '',
    );
  };

  const selectFindingDetail = (value: string) => {
    setFindingDetail(value);
    setFindingOptionalDetails({});
    if (
      findingCode === 'EXISTING_FIXED_RESTORATION' &&
      value !== 'CROWN' &&
      !isPartialRestorationMaterial(restorationMaterial)
    ) {
      setRestorationMaterial('ZIRCON');
    }
  };

  const selectActCode = (code: TreatmentActCode) => {
    setActCode(code);
    setActSearch('');
    setActDetail(getTreatmentActOption(code)?.detailOptions?.[0]?.value ?? '');
    if (
      isPartialRestoration(code) &&
      !isPartialRestorationMaterial(restorationMaterial)
    ) {
      setRestorationMaterial('ZIRCON');
    }
  };

  return {
    selection,
    setSelection,
    actCode,
    activeTooth,
    fillingMaterial,
    findingCode,
    findingDetail,
    findingAdditionalDetail,
    findingOptionalDetails,
    actDetail,
    onActDetailChange: setActDetail,
    onFindingOptionalDetailChange: (key: string, value: string) =>
      setFindingOptionalDetails((current) => ({ ...current, [key]: value })),
    findingSearch,
    note,
    onActCodeChange: selectActCode,
    onAddAct: addAct,
    onAddFinding: addFinding,
    onFillingMaterialChange: setFillingMaterial,
    onFindingCodeChange: selectFindingCode,
    onFindingDetailChange: selectFindingDetail,
    onFindingAdditionalDetailChange: setFindingAdditionalDetail,
    onFindingSearchChange: setFindingSearch,
    onActSearchChange: setActSearch,
    onNoteChange: setNote,
    onPeriodontalSiteChange: setPeriodontalSite,
    onRestorationMaterialChange: setRestorationMaterial,
    onSurfacesChange: setSurfaces,
    periodontalSite,
    restorationMaterial,
    selectedAct,
    selectedFinding,
    actSearch,
    surfaces,
  };
}

export type TreatmentEntryForm = ReturnType<typeof useTreatmentEntryForm>;
