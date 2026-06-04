'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'

import { Skeleton } from '../ui/Skeleton'

import type { DataTableProps } from './DataTable.impl'

/**
 * Dynamic-import wrapper for DataTable.
 *
 * `@tanstack/react-table` is heavy (~30 kB gzip) and only a fraction of pages
 * mount a table. Using `next/dynamic` (Next.js 16 recommended pattern) emits
 * the implementation as a separate chunk that loads on demand.
 *
 * Re-exports the public type surface so consumers don't need to import from
 * `DataTable.impl.tsx` directly.
 */

const LoadingSkeleton = () => (
  <div className="flex w-full flex-col gap-3" aria-busy="true" aria-live="polite">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
)

const DataTableLazy = dynamic(() => import('./DataTable.impl'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
}) as <TData>(props: DataTableProps<TData>) => React.ReactElement | null

function DataTable<TData>(props: DataTableProps<TData>) {
  return <DataTableLazy {...props} />
}

DataTable.displayName = 'DataTable'

export { DataTable }
export type {
  DataTableProps,
  DataTableLabels,
  DataTableColumnDef,
} from './DataTable.impl'
