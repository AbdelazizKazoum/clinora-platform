'use client';

import { useEffect, useId } from 'react';

import {
  validateOdontogramData,
  type OdontogramData,
  type OdontogramDataIssue,
  type OdontogramSelection,
  type ToothNumberingSystem,
} from '../model/odontogram';
import { validateOdontogramSelection } from '../model/odontogram-selection';
import type { LoadToothSvgTemplateOptions } from '../rendering/svg-template-loader';
import { OdontogramArch } from './odontogram-arch';
import styles from './odontogram.module.scss';
import { OdontogramViewport } from './odontogram-viewport';

export type OdontogramView = 'side' | 'side-and-occlusal';
export type OdontogramInteractionMode = 'view' | 'select';

export interface OdontogramProps {
  readonly data: OdontogramData;
  readonly selection: OdontogramSelection;
  readonly onSelectionChange?: (next: OdontogramSelection) => void;
  readonly numberingSystem?: ToothNumberingSystem;
  readonly view?: OdontogramView;
  readonly interactionMode?: OdontogramInteractionMode;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly basePath?: string;
  readonly assetPrefix?: string;
  readonly fetcher?: LoadToothSvgTemplateOptions['fetcher'];
}

export function Odontogram({
  data,
  selection,
  onSelectionChange,
  numberingSystem = 'fdi',
  view = 'side',
  interactionMode = 'view',
  ariaLabel = 'Odontogram',
  className,
  basePath,
  assetPrefix,
  fetcher,
}: OdontogramProps) {
  const reactId = useId();
  const chartInstanceId = `odontogram-${sanitizeDomIdPart(reactId)}`;
  const validationResult = validateOdontogramData(data);
  const selectionValidationResult = validateOdontogramSelection(selection);
  const renderedSelection = selectionValidationResult.valid
    ? selection
    : EMPTY_SELECTION;

  useEffect(() => {
    if (!selectionValidationResult.valid) {
      console.error(
        `Invalid odontogram selection: ${
          selectionValidationResult.reason ?? 'unknown reason'
        }`,
      );
    }
  }, [selectionValidationResult.reason, selectionValidationResult.valid]);

  if (!validationResult.valid) {
    return (
      <div
        aria-label={ariaLabel}
        className={[styles.odontogramRoot, className].filter(Boolean).join(' ')}
      >
        <div className={styles.chartError} role="alert">
          Odontogram data is incomplete or invalid.{' '}
          {formatIssueSummary(validationResult.issues)}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={[styles.odontogramRoot, className].filter(Boolean).join(' ')}
      data-odontogram-root=""
      data-odontogram-view={view}
    >
      <OdontogramViewport ariaLabel={ariaLabel}>
        {({ zoom }) => (
          <div
            aria-label={ariaLabel}
            aria-multiselectable={
              interactionMode === 'select' ? true : undefined
            }
            className={styles.chartInteractionLayer}
            role="listbox"
          >
            <OdontogramArch
              assetPrefix={assetPrefix}
              basePath={basePath}
              chartInstanceId={chartInstanceId}
              data={validationResult.data}
              fetcher={fetcher}
              interactionMode={interactionMode}
              numberingSystem={numberingSystem}
              onSelectionChange={
                selectionValidationResult.valid ? onSelectionChange : undefined
              }
              selection={renderedSelection}
              view={view}
              viewportScale={zoom}
            />
          </div>
        )}
      </OdontogramViewport>
    </div>
  );
}

const EMPTY_SELECTION: OdontogramSelection = {
  activeToothPosition: null,
  selectedToothPositions: [],
};

function formatIssueSummary(issues: readonly OdontogramDataIssue[]): string {
  if (issues.length === 0) {
    return 'No valid chart can be rendered.';
  }

  const firstIssue = issues[0];
  if (firstIssue.code === 'missing-position') {
    return `Missing tooth ${firstIssue.position}.`;
  }

  if (firstIssue.code === 'duplicate-position') {
    return `Duplicate tooth ${firstIssue.position}.`;
  }

  if (firstIssue.code === 'invalid-condition') {
    return `Invalid tooth ${firstIssue.position}: ${firstIssue.reason}.`;
  }

  return `Invalid field ${firstIssue.path}.`;
}

function sanitizeDomIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/gu, '-');
}
