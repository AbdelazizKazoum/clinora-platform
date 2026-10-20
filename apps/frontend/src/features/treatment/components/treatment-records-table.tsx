'use client';
import { useState, type ReactNode } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  FormSelect,
} from 'react-bootstrap';
import DataTable from '@/components/table/DataTable';
import TablePagination from '@/components/table/TablePagination';

interface TreatmentRecordsTableProps<T> {
  readonly data: T[];
  readonly columns: ColumnDef<T>[];
  readonly title: string;
  readonly description?: string;
  readonly headerAside?: ReactNode;
  readonly emptyMessage: string;
  readonly itemsName: string;
  readonly initialPageSize?: number;
  readonly showPageSize?: boolean;
}

export function TreatmentRecordsTable<T>({
  data,
  columns,
  title,
  description,
  headerAside,
  emptyMessage,
  itemsName,
  initialPageSize = 10,
  showPageSize = true,
}: TreatmentRecordsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalItems = table.getFilteredRowModel().rows.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);
  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div>
          <h5 className={description ? 'mb-1' : 'mb-0'}>{title}</h5>
          {description && <small className="text-muted">{description}</small>}
        </div>
        {headerAside}
        {showPageSize && (
          <div className="d-flex align-items-center gap-2">
            <div>
              <FormSelect
                className="form-control"
                aria-label={`${title} per page`}
                value={pageSize}
                onChange={(event) =>
                  table.setPageSize(Number(event.currentTarget.value))
                }
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        )}
      </CardHeader>
      <CardBody className="p-0">
        <DataTable<T> table={table} emptyMessage={emptyMessage} />
      </CardBody>
      {table.getRowModel().rows.length > 0 && (
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName={itemsName}
            showInfo
            previousPage={table.previousPage}
            canPreviousPage={table.getCanPreviousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            setPageIndex={table.setPageIndex}
            nextPage={table.nextPage}
            canNextPage={table.getCanNextPage()}
          />
        </CardFooter>
      )}
    </Card>
  );
}
