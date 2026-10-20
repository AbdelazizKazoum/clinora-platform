'use client';
import { memo, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from 'react-bootstrap';
import type {
  TreatmentAct,
  TreatmentActStatus,
  TreatmentVisit,
} from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { getTreatmentActOption } from '../model/treatment-catalogue';
import { formatTarget, recordStatusVariant } from './treatment-presentation';
import { TreatmentRecordsTable } from './treatment-records-table';
import { TreatmentActActions } from './treatment-act-actions';

export const TreatmentActsTable = memo(function TreatmentActsTable({
  actor,
  onApproveAct,
  onTransitionAct,
  projectionIssueIds,
  visit,
  currentSession = false,
}: {
  readonly actor: MockTreatmentActor;
  readonly onApproveAct: (id: string) => void;
  readonly onTransitionAct: (id: string, status: TreatmentActStatus) => void;
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
            <div className="fw-semibold">{label ?? row.original.code}</div>
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
        header: 'Actions',
        cell: ({ row }: { row: { original: TreatmentAct } }) => {
          return (
            <TreatmentActActions
              act={row.original}
              actor={actor}
              onApprove={onApproveAct}
              onTransition={onTransitionAct}
            />
          );
        },
      },
    ],
    [projectionIssueIds, actor, onApproveAct, onTransitionAct],
  );

  const data = useMemo(
    () =>
      currentSession
        ? visit.acts.filter((act) => act.enteredByUserId === actor.userId)
        : [...visit.acts],
    [visit.acts, actor.userId, currentSession],
  );
  return (
    <TreatmentRecordsTable
      data={data}
      columns={columns}
      title={currentSession ? 'Current Session' : 'Treatment acts'}
      description={
        currentSession ? 'Treatment acts added during this session' : undefined
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
