export { Odontogram } from './components/odontogram';
export { TOOTH_POSITIONS, validateOdontogramData } from './model/odontogram';
export {
  activateToothSelection,
  navigateToothSelection,
  sortToothPositions,
  validateOdontogramSelection,
} from './model/odontogram-selection';
export type {
  OdontogramInteractionMode,
  OdontogramProps,
  OdontogramView,
} from './components/odontogram';
export type {
  FillingMaterial,
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
  ToothNumberingSystem,
  ToothPosition,
  ToothSurface,
} from './model/odontogram';
export type {
  OdontogramSelectionValidationResult,
  ToothSelectionActivationMode,
  ToothSelectionNavigationKey,
} from './model/odontogram-selection';
