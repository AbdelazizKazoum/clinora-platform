'use client';

import type {
  OdontogramSelection,
  ToothNumberingSystem,
  ToothPosition,
} from '../model/odontogram';
import type { ReactNode } from 'react';
import type { LoadToothSvgTemplateOptions } from '../rendering/svg-template-loader';
import {
  LOWER_ARCH_POSITIONS,
  UPPER_ARCH_POSITIONS,
  hasOcclusalToothView,
  type ToothArch,
} from '../rendering/tooth-layout';
import { formatToothNumber } from '../utils/tooth-numbering';
import styles from './odontogram.module.scss';
import { OdontogramTooth } from './odontogram-tooth';
import type { OdontogramInteractionMode, OdontogramView } from './odontogram';

export interface OdontogramArchProps {
  readonly chartInstanceId: string;
  readonly numberingSystem: ToothNumberingSystem;
  readonly selection: OdontogramSelection;
  readonly view: OdontogramView;
  readonly interactionMode: OdontogramInteractionMode;
  readonly basePath?: string;
  readonly assetPrefix?: string;
  readonly fetcher?: LoadToothSvgTemplateOptions['fetcher'];
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
  numberingSystem,
  selection,
  view,
  interactionMode,
  basePath,
  assetPrefix,
  fetcher,
}: OdontogramArchProps) {
  const selectedPositions = new Set(selection.selectedToothPositions);

  return (
    <div className={styles.archStack} data-odontogram-view={view}>
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
            const option = (
              <ToothOption
                active={isActive}
                ariaLabel={`Tooth ${label}`}
                id={optionId}
                interactionMode={interactionMode}
                key={position}
                position={position}
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
                    suppressImageRole
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
                        suppressImageRole
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
    </div>
  );
}

interface ToothOptionProps {
  readonly active: boolean;
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly id: string;
  readonly interactionMode: OdontogramInteractionMode;
  readonly position: ToothPosition;
  readonly selected: boolean;
}

function ToothOption({
  active,
  ariaLabel,
  children,
  id,
  interactionMode,
  position,
  selected,
}: ToothOptionProps) {
  return (
    <div
      aria-current={active ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-selected={selected}
      className={styles.toothOption}
      data-odontogram-interaction-mode={interactionMode}
      data-odontogram-position={position}
      data-odontogram-tooth-option=""
      id={id}
      role="option"
      tabIndex={0}
    >
      {children}
    </div>
  );
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
