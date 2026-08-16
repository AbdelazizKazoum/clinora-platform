export { Odontogram } from './components/odontogram';
export { ToothSurfaceSelector } from './components/tooth-surface-selector';
export { TOOTH_POSITIONS, validateOdontogramData } from './model/odontogram';
export {
  activateToothSelection,
  navigateToothSelection,
  sortToothPositions,
  validateOdontogramSelection,
} from './model/odontogram-selection';
export {
  getToothSurfaceLabel,
  getToothSurfaceNotation,
} from './utils/surface-notation';
export type {
  OdontogramInteractionMode,
  OdontogramProps,
  OdontogramView,
} from './components/odontogram';
export type { ToothSurfaceSelectorProps } from './components/tooth-surface-selector';
export type {
  FillingMaterial,
  ClinicalVisualConcept,
  ImplantProsthesisType,
  OdontogramAppearance,
  OdontogramCondition,
  OdontogramData,
  OdontogramDataIssue,
  OdontogramDataValidationResult,
  OdontogramSelection,
  OdontogramTooth,
  RestorationMaterial,
  RestorationType,
  ToothBase,
  ToothDentition,
  ToothFractureRegion,
  ToothNumberingSystem,
  ToothPosition,
  ToothSurface,
  ToothStructureState,
} from './model/odontogram';
export type {
  OdontogramSelectionValidationResult,
  ToothSelectionActivationMode,
  ToothSelectionNavigationKey,
} from './model/odontogram-selection';
export type { ToothSurfaceNotation } from './utils/surface-notation';
