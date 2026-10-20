'use client';
import { memo } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Stack,
} from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import { Odontogram, type OdontogramSelection } from '@/features/odontogram';
import type { TreatmentOdontogramProjection } from '../model/treatment-odontogram.mapper';
import type { TreatmentProjectionMode } from '../model/treatment-workflow';
import styles from './treatment-workspace.module.scss';

export const TreatmentOdontogramCard = memo(function TreatmentOdontogramCard({
  projection,
  projectionMode,
  conflictCount,
  selection,
  onProjectionModeChange,
  onSelectionChange,
}: {
  readonly projection: TreatmentOdontogramProjection;
  readonly projectionMode: TreatmentProjectionMode;
  readonly conflictCount: number;
  readonly selection: OdontogramSelection;
  readonly onProjectionModeChange: (mode: TreatmentProjectionMode) => void;
  readonly onSelectionChange: (selection: OdontogramSelection) => void;
}) {
  return (
    <Card className={styles.chartCard}>
      <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h5 className="mb-1">Clinical odontogram</h5>
          <p className="text-muted mb-0 fs-sm">
            Click a tooth to inspect it. Ctrl/Cmd-click selects a bridge span.
          </p>
        </div>
        <Stack direction="horizontal" gap={2}>
          <ButtonGroup aria-label="Treatment projection mode" size="sm">
            {(
              [
                ['combined', 'Combined'],
                ['status-only', 'Status'],
                ['plan-only', 'Plan'],
              ] as const
            ).map(([mode, label]) => (
              <Button
                key={mode}
                onClick={() => onProjectionModeChange(mode)}
                variant={
                  projectionMode === mode ? 'primary' : 'outline-primary'
                }
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
          <div
            aria-label="Odontogram visual legend"
            className={styles.chartLegend}
          >
            <span>
              <i className={styles.existingLegend} /> Existing
            </span>
            <span>
              <i className={styles.plannedLegend} /> Planned
            </span>
          </div>
          <Badge bg="primary">
            {selection.selectedToothPositions.length} selected
          </Badge>
          {projection.issues.length > 0 && (
            <Badge bg="warning" className="badge-soft-warning text-warning">
              {projection.issues.length} not visualized
            </Badge>
          )}
        </Stack>
      </CardHeader>
      <CardBody>
        <Odontogram
          ariaLabel="Patient treatment odontogram"
          data={projection.data}
          interactionMode="select"
          onSelectionChange={onSelectionChange}
          selection={selection}
          view="side-and-occlusal"
        />
        {projection.issues.length > 0 && (
          <div className={styles.projectionNotice}>
            <Icon icon="info" />
            <span>
              Rich clinical details remain in the record even when the current
              renderer has no matching symbol.
            </span>
          </div>
        )}
        {conflictCount > 0 && (
          <Alert className="mt-3 mb-0 py-2" variant="warning">
            {conflictCount} overlapping active plan conflict(s) require
            deterministic dentist resolution.
          </Alert>
        )}
      </CardBody>
    </Card>
  );
});
