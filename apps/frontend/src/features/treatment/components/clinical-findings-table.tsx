'use client';
import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type { ClinicalFinding, TreatmentVisit } from '../model/treatment';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import { getClinicalFindingOption } from '../model/treatment-catalogue';
import { formatTarget, recordStatusVariant } from './treatment-presentation';
import { TreatmentRecordsTable } from './treatment-records-table';

export function ClinicalFindingsTable({
  actor,
  onApproveFinding,
  projectionIssueIds,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly onApproveFinding: (id: string) => void;
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
          <div className="d-flex align-items-center justify-content-center gap-1">
            {row.original.status === 'DRAFT' && actor.role === 'doctor' && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onApproveFinding(row.original.id)}
              >
                <Icon icon="check" className="me-1" />
                Approve
              </Button>
            )}
          </div>
        ),
      },
    ],
    [projectionIssueIds, actor.role, onApproveFinding],
  );

  const data = useMemo(() => [...visit.findings], [visit.findings]);
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
