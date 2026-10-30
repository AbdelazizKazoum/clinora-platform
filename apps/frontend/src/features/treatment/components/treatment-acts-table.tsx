'use client';
import { memo, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from 'react-bootstrap';
import type {
  TreatmentAct,
  TreatmentActStatus,
  TreatmentSessionOutcome,
  TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { getTreatmentActOption } from '../model/treatment-catalogue';
import { formatTarget, recordStatusVariant } from './treatment-presentation';
import { TreatmentRecordsTable } from './treatment-records-table';
import { TreatmentActActions } from './treatment-act-actions';
import { ClinicalRecordDetails } from './clinical-record-details';

export const TreatmentActsTable = memo(function TreatmentActsTable({
  actor,
  onTransitionAct,
  onCloseSession,
  onRemoveAct,
  removablePlanIds,
  projectionIssueIds,
  visit,
  currentSession = false,
}: {
  readonly actor: MockTreatmentActor;
  readonly onRemoveAct: (id: string) => void;
  readonly removablePlanIds: ReadonlySet<string>;
  readonly onTransitionAct: (
    id: string,
    status: TreatmentActStatus,
    reason?: string,
  ) => void;
  readonly onCloseSession: (
    id: string,
    outcome: TreatmentSessionOutcome,
    note: string,
  ) => void;
  readonly projectionIssueIds?: ReadonlySet<string>;
  readonly visit: TreatmentVisit;
  readonly currentSession?: boolean;
}) {
  const columns = useMemo<ColumnDef<TreatmentAct>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Treatment Act',
        cell: ({ row }) => {
          const label = getTreatmentActOption(row.original.code)?.label;
          return (
            <div>
              <div className="fw-semibold">{label ?? row.original.code}</div>
              <ClinicalRecordDetails
                code={row.original.code}
                details={row.original.details}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'target',
        header: 'Target',
        cell: ({ row }) => (
          <div className="text-muted">
            {formatTarget(
              row.original.target.toothNumbers,
              row.original.target.surfaces,
            )}
            {row.original.target.surfaces.length > 0 && (
              <small className="d-block">
                {row.original.target.surfaces.join(', ')}
              </small>
            )}
            {row.original.target.arch && (
              <small className="d-block">
                Arch: {row.original.target.arch}
              </small>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <Badge bg={recordStatusVariant(row.original.status)}>
              {row.original.status}
            </Badge>
            {projectionIssueIds?.has(row.original.id) && (
              <Badge bg="light" className="text-muted">
                Not visualized
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Note',
        cell: ({ row }) => (
          <div className="fs-sm text-muted">{row.original.note || '—'}</div>
        ),
      },
      {
        accessorKey: 'enteredByUserId',
        header: 'Recorded by',
        cell: ({ row }) => (
          <div className="fs-sm text-muted">
            {row.original.enteredByUserId === actor.userId
              ? actor.name
              : row.original.enteredByUserId}
            <small className="d-block">
              Doctor:{' '}
              {row.original.performedByUserId ?? visit.responsibleDentistId}
            </small>
          </div>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }: { row: { original: TreatmentAct } }) => {
          return (
            <TreatmentActActions
              act={row.original}
              actor={actor}
              visit={visit}
              onTransition={onTransitionAct}
              onCloseSession={onCloseSession}
              onRemove={onRemoveAct}
              canRemove={removablePlanIds.has(row.original.id)}
            />
          );
        },
      },
    ],
    [
      projectionIssueIds,
      actor,
      onTransitionAct,
      onCloseSession,
      onRemoveAct,
      removablePlanIds,
      visit,
    ],
  );

  const data = useMemo(
    () =>
      currentSession
        ? visit.acts.filter(
            (act) =>
              act.status !== 'COMPLETED' ||
              visit.treatmentSessions?.some(
                (session) =>
                  session.planItemId === act.id && session.visitId === visit.id,
              ),
          )
        : [...visit.acts],
    [visit.acts, visit.treatmentSessions, visit.id, currentSession],
  );
  return (
    <TreatmentRecordsTable
      data={data}
      columns={columns}
      title={currentSession ? 'Current visit treatment acts' : 'Treatment acts'}
      description={
        currentSession
          ? 'Plans and treatment sessions associated with this visit'
          : undefined
      }
      headerAside={
        currentSession ? (
          <Badge bg="primary">{data.length} acts</Badge>
        ) : undefined
      }
      emptyMessage={
        currentSession
          ? 'No treatment acts added in this session yet.'
          : 'No treatment acts planned.'
      }
      itemsName="treatment acts"
      initialPageSize={currentSession ? 5 : 10}
      showPageSize={!currentSession}
    />
  );
});
