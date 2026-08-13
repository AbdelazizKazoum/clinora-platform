'use client';

import type {
  OdontogramData,
  OdontogramSelection,
  OdontogramTooth as OdontogramToothModel,
  ToothNumberingSystem,
  ToothPosition,
} from '../model/odontogram';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  activateToothSelection,
  navigateToothSelection,
  type ToothSelectionNavigationKey,
} from '../model/odontogram-selection';
import type { LoadToothSvgTemplateOptions } from '../rendering/svg-template-loader';
import {
  LOWER_ARCH_POSITIONS,
  UPPER_ARCH_POSITIONS,
  hasOcclusalToothView,
  type ToothArch,
} from '../rendering/tooth-layout';
import { formatToothNumber } from '../utils/tooth-numbering';
import styles from './odontogram.module.scss';
import { BridgeOverlay } from './bridge-overlay';
import { OdontogramTooth } from './odontogram-tooth';
import type { OdontogramInteractionMode, OdontogramView } from './odontogram';

export interface OdontogramArchProps {
  readonly chartInstanceId: string;
  readonly data: OdontogramData;
  readonly numberingSystem: ToothNumberingSystem;
  readonly selection: OdontogramSelection;
  readonly view: OdontogramView;
  readonly interactionMode: OdontogramInteractionMode;
  readonly onSelectionChange?: (next: OdontogramSelection) => void;
  readonly basePath?: string;
  readonly assetPrefix?: string;
  readonly fetcher?: LoadToothSvgTemplateOptions['fetcher'];
  readonly viewportScale?: number;
}

const ARCH_CONFIGS = [
  {
    arch: 'upper',
    positions: UPPER_ARCH_POSITIONS,
    sideCellClassName: styles.upperSideCell,
    occlusalCellClassName: styles.upperOcclusalCell,
    labelCellClassName: styles.upperLabelCell,
    labelFirst: true,
  },
  {
    arch: 'lower',
    positions: LOWER_ARCH_POSITIONS,
    sideCellClassName: styles.lowerSideCell,
    occlusalCellClassName: styles.lowerOcclusalCell,
    labelCellClassName: styles.lowerLabelCell,
    labelFirst: false,
  },
] as const satisfies readonly {
  readonly arch: ToothArch;
  readonly positions: readonly ToothPosition[];
  readonly sideCellClassName: string;
  readonly occlusalCellClassName: string;
  readonly labelCellClassName: string;
  readonly labelFirst: boolean;
}[];

export function OdontogramArch({
  chartInstanceId,
  data,
  numberingSystem,
  selection,
  view,
  interactionMode,
  onSelectionChange,
  basePath,
  assetPrefix,
  fetcher,
  viewportScale = 1,
}: OdontogramArchProps) {
  const toothByPosition = new Map(
    data.teeth.map((tooth) => [tooth.position, tooth]),
  );
  const selectedPositions = new Set(selection.selectedToothPositions);
  const [hoveredPosition, setHoveredPosition] = useState<ToothPosition | null>(
    null,
  );
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<ToothPosition, HTMLDivElement>());

  const emitSelectionChange = (nextSelection: OdontogramSelection) => {
    if (interactionMode !== 'select') {
      return;
    }

    onSelectionChange?.(nextSelection);
    focusActiveToothOption(
      optionRefs.current,
      nextSelection.activeToothPosition,
    );
  };

  const handleActivate = (
    position: ToothPosition,
    mode: 'replace' | 'toggle',
  ) => {
    emitSelectionChange(activateToothSelection(selection, position, mode));
  };

  const handleNavigate = (
    event: KeyboardEvent<HTMLDivElement>,
    key: ToothSelectionNavigationKey,
  ) => {
    event.preventDefault();
    emitSelectionChange(navigateToothSelection(selection, key));
  };

  return (
    <div
      className={styles.archStack}
      data-odontogram-view={view}
      ref={chartContainerRef}
    >
      {ARCH_CONFIGS.map((archConfig) => (
        <div
          className={styles.archGrid}
          data-odontogram-arch={archConfig.arch}
          key={archConfig.arch}
        >
          {archConfig.positions.map((position) => {
            const label = formatToothNumber(position, numberingSystem);
            const optionId = `${chartInstanceId}-tooth-${position}`;
            const isSelected = selectedPositions.has(position);
            const isActive = selection.activeToothPosition === position;
            const isHovered = hoveredPosition === position;
            const tooth = getRequiredTooth(toothByPosition, position);
            const option = (
              <ToothOption
                active={isActive}
                ariaLabel={`Tooth ${label}`}
                hovered={isHovered}
                id={optionId}
                interactionMode={interactionMode}
                key={position}
                onActivate={handleActivate}
                onNavigate={handleNavigate}
                onPointerEnter={setHoveredPosition}
                onPointerLeave={() => setHoveredPosition(null)}
                position={position}
                registerOptionRef={(element) => {
                  if (element === null) {
                    optionRefs.current.delete(position);
                    return;
                  }

                  optionRefs.current.set(position, element);
                }}
                selected={isSelected}
              >
                {archConfig.labelFirst ? (
                  <ToothLabel
                    className={archConfig.labelCellClassName}
                    label={label}
                    position={position}
                  />
                ) : null}
                <div
                  className={`${styles.toothCell} ${styles.sideCell} ${archConfig.sideCellClassName}`}
                  data-odontogram-bridge-anchor="true"
                  data-odontogram-position={position}
                >
                  <OdontogramTooth
                    assetPrefix={assetPrefix}
                    basePath={basePath}
                    chartInstanceId={chartInstanceId}
                    fetcher={fetcher}
                    position={position}
                    showUnsupportedVisualFallback={
                      view === 'side' || !hasOcclusalToothView(position)
                    }
                    suppressImageRole
                    tooth={tooth}
                    view="side"
                  />
                </div>
                {view === 'side-and-occlusal' ? (
                  <div
                    className={`${styles.toothCell} ${styles.occlusalCell} ${archConfig.occlusalCellClassName}`}
                    data-odontogram-position={position}
                    data-odontogram-view="occlusal"
                  >
                    {hasOcclusalToothView(position) ? (
                      <OdontogramTooth
                        assetPrefix={assetPrefix}
                        basePath={basePath}
                        chartInstanceId={chartInstanceId}
                        fetcher={fetcher}
                        position={position}
                        showUnsupportedVisualFallback={false}
                        suppressImageRole
                        tooth={tooth}
                        view="occlusal"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={styles.occlusalPlaceholder}
                      />
                    )}
                  </div>
                ) : null}
                {archConfig.labelFirst ? null : (
                  <ToothLabel
                    className={archConfig.labelCellClassName}
                    label={label}
                    position={position}
                  />
                )}
              </ToothOption>
            );

            return option;
          })}
        </div>
      ))}
      <BridgeOverlay
        containerRef={chartContainerRef}
        data={data}
        layoutKey={`${view}:${viewportScale}`}
        measurementScale={viewportScale}
      />
    </div>
  );
}

interface ToothOptionProps {
  readonly active: boolean;
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly hovered: boolean;
  readonly id: string;
  readonly interactionMode: OdontogramInteractionMode;
  readonly onActivate: (
    position: ToothPosition,
    mode: 'replace' | 'toggle',
  ) => void;
  readonly onNavigate: (
    event: KeyboardEvent<HTMLDivElement>,
    key: ToothSelectionNavigationKey,
  ) => void;
  readonly onPointerEnter: (position: ToothPosition) => void;
  readonly onPointerLeave: () => void;
  readonly position: ToothPosition;
  readonly registerOptionRef: (element: HTMLDivElement | null) => void;
  readonly selected: boolean;
}

function ToothOption({
  active,
  ariaLabel,
  children,
  hovered,
  id,
  interactionMode,
  onActivate,
  onNavigate,
  onPointerEnter,
  onPointerLeave,
  position,
  registerOptionRef,
  selected,
}: ToothOptionProps) {
  return (
    <div
      aria-current={active ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-selected={selected}
      className={styles.toothOption}
      data-odontogram-hovered={hovered ? 'true' : undefined}
      data-odontogram-interaction-mode={interactionMode}
      data-odontogram-position={position}
      data-odontogram-tooth-option=""
      id={id}
      onClick={(event) => {
        onActivate(
          position,
          event.ctrlKey || event.metaKey ? 'toggle' : 'replace',
        );
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate(
            position,
            event.ctrlKey || event.metaKey ? 'toggle' : 'replace',
          );
          return;
        }

        if (isNavigationKey(event.key)) {
          onNavigate(event, event.key);
        }
      }}
      onPointerEnter={() => onPointerEnter(position)}
      onPointerLeave={onPointerLeave}
      ref={registerOptionRef}
      role="option"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

function isNavigationKey(key: string): key is ToothSelectionNavigationKey {
  return (
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'Escape'
  );
}

function focusActiveToothOption(
  optionRefs: ReadonlyMap<ToothPosition, HTMLDivElement>,
  position: ToothPosition | null,
): void {
  if (position === null) {
    return;
  }

  optionRefs.get(position)?.focus();
}

function getRequiredTooth(
  toothByPosition: ReadonlyMap<ToothPosition, OdontogramToothModel>,
  position: ToothPosition,
): OdontogramToothModel {
  const tooth = toothByPosition.get(position);
  if (tooth === undefined) {
    throw new Error(`Validated odontogram data is missing tooth ${position}`);
  }

  return tooth;
}

function ToothLabel({
  className,
  label,
  position,
}: {
  readonly className: string;
  readonly label: string;
  readonly position: ToothPosition;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.toothLabel} ${className}`}
      data-odontogram-position={position}
    >
      {label}
    </span>
  );
}
