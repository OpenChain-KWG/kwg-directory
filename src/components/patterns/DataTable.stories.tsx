import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Inbox } from 'lucide-react'

import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

import { EmptyState } from './EmptyState'
import {
  DataTable,
  type DataTableColumnDef,
  type DataTableLabels,
} from './DataTable'

interface Member {
  id: string
  nameKo: string
  company: string
  category: '대기업' | '중견/중소' | '연구/공공' | '스타트업'
  approved: boolean
  joinedAt: string
}

const ROWS: Member[] = [
  { id: 'm1', nameKo: '김철수', company: 'OpenChain Korea', category: '대기업', approved: true, joinedAt: '2024-01-12' },
  { id: 'm2', nameKo: '이영희', company: 'KWG Foundation', category: '연구/공공', approved: true, joinedAt: '2024-02-18' },
  { id: 'm3', nameKo: '박민수', company: 'Acme Corp', category: '중견/중소', approved: false, joinedAt: '2024-03-05' },
  { id: 'm4', nameKo: '최서연', company: 'Globex', category: '스타트업', approved: true, joinedAt: '2024-04-22' },
  { id: 'm5', nameKo: '정도윤', company: 'Initech', category: '대기업', approved: true, joinedAt: '2024-05-10' },
  { id: 'm6', nameKo: '한지유', company: 'Hooli', category: '스타트업', approved: false, joinedAt: '2024-06-14' },
  { id: 'm7', nameKo: '서민준', company: 'Soylent', category: '중견/중소', approved: true, joinedAt: '2024-07-03' },
  { id: 'm8', nameKo: '오은우', company: 'Massive Dynamic', category: '연구/공공', approved: true, joinedAt: '2024-08-20' },
  { id: 'm9', nameKo: '강나윤', company: 'Pied Piper', category: '스타트업', approved: true, joinedAt: '2024-09-12' },
  { id: 'm10', nameKo: '윤시우', company: 'Stark Industries', category: '대기업', approved: true, joinedAt: '2024-10-01' },
  { id: 'm11', nameKo: '임수아', company: 'Wayne Enterprises', category: '대기업', approved: true, joinedAt: '2024-11-08' },
  { id: 'm12', nameKo: '신유준', company: 'Cyberdyne Systems', category: '연구/공공', approved: false, joinedAt: '2024-12-01' },
]

const COLUMNS: DataTableColumnDef<Member>[] = [
  { id: 'nameKo', accessorKey: 'nameKo', header: 'Name', enableSorting: true },
  { id: 'company', accessorKey: 'company', header: 'Company', enableSorting: true },
  {
    id: 'category',
    accessorKey: 'category',
    header: 'Category',
    enableSorting: true,
    cell: ({ getValue }) => (
      <Badge variant="outline">{String(getValue<string>())}</Badge>
    ),
  },
  {
    id: 'approved',
    accessorKey: 'approved',
    header: 'Status',
    enableSorting: true,
    cell: ({ getValue }) => {
      const v = getValue<boolean>()
      return (
        <Badge variant={v ? 'default' : 'outline'}>
          {v ? 'Approved' : 'Pending'}
        </Badge>
      )
    },
  },
  { id: 'joinedAt', accessorKey: 'joinedAt', header: 'Joined', enableSorting: true },
]

const LABELS: DataTableLabels = {
  paginationLabel: 'Members table pagination',
  previousLabel: 'Previous',
  nextLabel: 'Next',
  selectAllLabel: 'Select all rows on this page',
  selectRowLabel: (i) => `Select row ${i + 1}`,
  sortColumnLabel: (id) => `Sort by ${id}`,
  selectedRows: (selected, total) =>
    `${selected} of ${total} row(s) selected`,
}

const meta: Meta<typeof DataTable> = {
  title: 'Patterns/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  render: () => (
    <DataTable<Member>
      data={ROWS}
      columns={COLUMNS}
      labels={LABELS}
      initialPageSize={5}
      emptyTitle="No members"
    />
  ),
}

function WithRowSelectionExample() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">
        Selected ids: {selectedIds.join(', ') || '—'}
      </p>
      <DataTable<Member>
        data={ROWS}
        columns={COLUMNS}
        labels={LABELS}
        initialPageSize={5}
        enableRowSelection
        onSelectionChange={(state) => {
          const ids = Object.entries(state)
            .filter(([, v]) => v)
            .map(([rowId]) => ROWS[Number(rowId)]?.id)
            .filter(Boolean) as string[]
          setSelectedIds(ids)
        }}
        emptyTitle="No members"
      />
    </div>
  )
}

export const WithRowSelection: Story = {
  render: () => <WithRowSelectionExample />,
}

export const Loading: Story = {
  render: () => (
    <DataTable<Member>
      data={[]}
      columns={COLUMNS}
      labels={LABELS}
      loading
      skeletonRowCount={6}
      emptyTitle="No members"
    />
  ),
}

export const Empty: Story = {
  render: () => (
    <DataTable<Member>
      data={[]}
      columns={COLUMNS}
      labels={LABELS}
      empty={
        <EmptyState
          illustration={<Inbox className="h-8 w-8" aria-hidden />}
          title="No members yet"
          description="Approved members will appear here."
          action={<Button size="sm">Invite member</Button>}
        />
      }
    />
  ),
}

function ClickableExample() {
  const [last, setLast] = React.useState<Member | null>(null)
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">
        Last clicked row: {last ? `${last.nameKo} (${last.company})` : '—'}
      </p>
      <DataTable<Member>
        data={ROWS}
        columns={COLUMNS}
        labels={LABELS}
        initialPageSize={5}
        onRowClick={(row) => setLast(row)}
        emptyTitle="No members"
      />
    </div>
  )
}

export const Clickable: Story = {
  render: () => <ClickableExample />,
}

export const Compact: Story = {
  render: () => (
    <DataTable<Member>
      data={ROWS.slice(0, 3)}
      columns={COLUMNS}
      labels={LABELS}
      initialPageSize={3}
      emptyTitle="No members"
    />
  ),
}
