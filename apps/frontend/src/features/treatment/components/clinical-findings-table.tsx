'use client';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from 'react-bootstrap';
import type { ClinicalFinding, TreatmentVisit } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { getClinicalFindingOption } from '../model/treatment-catalogue';
import { canRemoveTreatmentFinding } from '../model/treatment.rules';
import { formatTarget, recordStatusVariant } from './treatment-presentation';
import { TreatmentRecordsTable } from './treatment-records-table';
import { ClinicalRecordDetails } from './clinical-record-details';
import { ClinicalFindingActions } from './clinical-finding-actions';

export function ClinicalFindingsTable({
  actor,
  onRemoveFinding,
  projectionIssueIds,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly onRemoveFinding: (id: string, reason?: string) => void;
  readonly projectionIssueIds: ReadonlySet<string>;
  readonly visit: TreatmentVisit;
}) {
  const columns = useMemo<ColumnDef<ClinicalFinding>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Finding',
        cell: ({ row }) => {
          const label = getClinicalFindingOption(row.original.code)?.label;
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
            {projectionIssueIds.has(row.original.id) && (
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
        cell: ({ row }: { row: { original: ClinicalFinding } }) => (
          <ClinicalFindingActions
            actor={actor}
            finding={row.original}
            onRemove={onRemoveFinding}
            canRemove={canRemoveTreatmentFinding(
              visit,
              row.original,
              actor.userId,
              actor.role,
            )}
          />
        ),
      },
    ],
    [projectionIssueIds, actor, onRemoveFinding, visit],
  );

  const data = useMemo(
    () => visit.findings.filter(({ status }) => status !== 'ENTERED_IN_ERROR'),
    [visit.findings],
  );
  return (
    <TreatmentRecordsTable
      data={data}
      columns={columns}
      title="Clinical findings"
      emptyMessage="No clinical findings recorded."
      itemsName="findings"
    />
  );
}
