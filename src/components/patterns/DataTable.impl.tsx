'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Checkbox } from '../ui/Checkbox'
import { Skeleton } from '../ui/Skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/Pagination'

import { EmptyState } from './EmptyState'

/**
 * DataTable — generic, headless-driven table built on TanStack Table v8.
 *
 * Phase 2 scope:
 *   - sorting (toggle via header click)
 *   - row selection (single + multi via Checkbox primitive)
 *   - client-side pagination (Pagination primitive)
 *   - loading / empty slots (Skeleton + EmptyState patterns)
 *
 * Out of scope (tracked separately):
 *   - virtualization — pending ADR; row counts >500 should mount with care.
 *   - server-side data fetching — caller can pre-paginate and pass `data`.
 *
 * Bundle: this implementation file is dynamically imported by `DataTable.tsx`
 * via `next/dynamic` so TanStack Table never lands in the initial chunk of
 * pages that don't render a table.
 */

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue>

export interface DataTableLabels {
  /** Selected-rows summary, e.g. `"{selected} of {total} selected"`. */
  selectedRows?: (selected: number, total: number) => React.ReactNode
  /** Pagination landmark `aria-label`. */
  paginationLabel: string
  /** Visible label for the previous-page button. */
  previousLabel?: React.ReactNode
  /** Visible label for the next-page button. */
  nextLabel?: React.ReactNode
  /** `aria-label` for select-all checkbox. */
  selectAllLabel: string
  /** `aria-label` template for per-row select checkbox. */
  selectRowLabel: (rowIndex: number) => string
  /** `aria-label` template for sortable column header buttons. */
  sortColumnLabel: (columnId: string) => string
}

export interface DataTableProps<TData> {
  /** Source data. Sort + pagination is applied client-side. */
  data: TData[]
  /** TanStack column definitions. */
  columns: DataTableColumnDef<TData>[]
  /** Initial page size. */
  initialPageSize?: number
  /** Enable per-row selection checkboxes. */
  enableRowSelection?: boolean
  /** Notified when selection changes (controlled-style callback). */
  onSelectionChange?: (selection: RowSelectionState) => void
  /** Called when a body row is clicked (excludes interactive cells). */
  onRowClick?: (row: TData) => void
  /** Show skeleton rows in place of data. */
  loading?: boolean
  /** Custom empty-state node. Falls back to `EmptyState` with `emptyTitle`. */
  empty?: React.ReactNode
  /** Title used when `empty` slot is omitted. */
  emptyTitle?: React.ReactNode
  /** Optional description used by the default empty state. */
  emptyDescription?: React.ReactNode
  /** Localized strings (see DataTableLabels). */
  labels: DataTableLabels
  /** Optional className applied to the outer wrapper. */
  className?: string
  /** Number of skeleton rows shown when `loading`. */
  skeletonRowCount?: number
}

function buildSelectionColumn<TData>(
  labels: Pick<DataTableLabels, 'selectAllLabel' | 'selectRowLabel'>,
): DataTableColumnDef<TData> {
  return {
    id: '__select__',
    enableSorting: false,
    size: 32,
    header: ({ table }: { table: TanstackTable<TData> }) => {
      const allSelected = table.getIsAllPageRowsSelected()
      const someSelected = table.getIsSomePageRowsSelected()
      const checked: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false
      return (
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label={labels.selectAllLabel}
        />
      )
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={labels.selectRowLabel(row.index)}
        onClick={(e) => e.stopPropagation()}
      />
    ),
  }
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5" aria-hidden />
  if (direction === 'desc') return <ArrowDown className="h-3.5 w-3.5" aria-hidden />
  return (
    <ArrowUpDown
      className="h-3.5 w-3.5 text-[var(--color-text-faint)]"
      aria-hidden
    />
  )
}

function DataTableInner<TData>({
  data,
  columns,
  initialPageSize = 10,
  enableRowSelection = false,
  onSelectionChange,
  onRowClick,
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  labels,
  className,
  skeletonRowCount = 5,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const handleSelectionChange = React.useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (onSelectionChange) onSelectionChange(next)
        return next
      })
    },
    [onSelectionChange],
  )

  const tableColumns = React.useMemo<DataTableColumnDef<TData>[]>(() => {
    if (!enableRowSelection) return columns
    return [buildSelectionColumn<TData>(labels), ...columns]
  }, [columns, enableRowSelection, labels])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection },
    enableRowSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: enableRowSelection
      ? handleSelectionChange
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: initialPageSize, pageIndex: 0 } },
  })

  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows
  const hasRows = rows.length > 0
  const totalCount = data.length
  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const colSpan = tableColumns.length

  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div
        className={cn(
          'overflow-x-auto rounded-md',
          'border border-[var(--color-border-subtle)]',
          'bg-[var(--color-bg-surface)]',
        )}
      >
        <table className="w-full text-sm">
          <thead
            className={cn(
              'border-b border-[var(--color-border-subtle)]',
              'bg-[var(--color-bg-surface-alt)] text-left',
            )}
          >
            {headerGroups.map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={{ width: header.getSize() }}
                      className={cn(
                        'h-10 px-3 align-middle font-medium',
                        'text-[var(--color-text-muted)]',
                      )}
                      aria-sort={
                        sortDirection === 'asc'
                          ? 'ascending'
                          : sortDirection === 'desc'
                            ? 'descending'
                            : canSort
                              ? 'none'
                              : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={labels.sortColumnLabel(header.column.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            'rounded-sm px-1 -mx-1 py-0.5',
                            'transition-colors duration-150 ease-out',
                            'hover:text-[var(--color-text-default)]',
                            'focus-visible:outline-none focus-visible:ring-2',
                            'focus-visible:ring-[var(--color-focus-ring)]',
                            'focus-visible:ring-offset-2',
                            'focus-visible:ring-offset-[var(--color-bg-surface-alt)]',
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon direction={sortDirection} />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
                <tr
                  key={`skeleton-${rowIdx}`}
                  className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                >
                  {tableColumns.map((col, colIdx) => (
                    <td
                      key={`skeleton-cell-${colIdx}`}
                      className="h-12 px-3 align-middle"
                    >
                      <Skeleton
                        className={cn(
                          col.id === '__select__' ? 'h-4 w-4' : 'h-4 w-3/4',
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : hasRows ? (
              rows.map((row) => {
                const isClickable = Boolean(onRowClick)
                return (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={
                      isClickable ? () => onRowClick?.(row.original) : undefined
                    }
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onRowClick?.(row.original)
                            }
                          }
                        : undefined
                    }
                    tabIndex={isClickable ? 0 : undefined}
                    role={isClickable ? 'button' : undefined}
                    className={cn(
                      'border-b border-[var(--color-border-subtle)] last:border-b-0',
                      'transition-colors duration-150 ease-out',
                      'data-[state=selected]:bg-[var(--color-bg-surface-alt)]',
                      isClickable &&
                        cn(
                          'cursor-pointer',
                          'hover:bg-[var(--color-bg-surface-alt)]',
                          'focus-visible:outline-none focus-visible:ring-2',
                          'focus-visible:ring-[var(--color-focus-ring)]',
                          'focus-visible:ring-offset-0',
                        ),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="h-12 px-3 align-middle text-[var(--color-text-default)]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={colSpan} className="h-24 px-3 align-middle">
                  {empty ?? (
                    <EmptyState
                      title={emptyTitle ?? ''}
                      description={emptyDescription}
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-3 px-1 sm:flex-row">
        {enableRowSelection && labels.selectedRows ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            {labels.selectedRows(selectedCount, totalCount)}
          </p>
        ) : (
          <span className="hidden sm:block" />
        )}
        {pageCount > 1 ? (
          <Pagination aria-label={labels.paginationLabel}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  label={labels.previousLabel}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={i === pageIndex}
                    onClick={() => table.setPageIndex(i)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  label={labels.nextLabel}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  )
}

DataTableInner.displayName = 'DataTable'

export default DataTableInner
