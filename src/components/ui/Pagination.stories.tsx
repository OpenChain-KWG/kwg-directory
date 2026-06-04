import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Pagination>

function PaginationDemo({ pageCount }: { pageCount: number }) {
  const [page, setPage] = React.useState(1)
  return (
    <Pagination aria-label="Demo pagination">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            label="Previous"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
        </PaginationItem>
        {Array.from({ length: pageCount }).map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink isActive={i + 1 === page} onClick={() => setPage(i + 1)}>
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            label="Next"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export const Default: Story = {
  render: () => <PaginationDemo pageCount={5} />,
}

export const WithEllipsis: Story = {
  render: () => (
    <Pagination aria-label="Long pagination">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious label="Previous" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>4</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>5</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>6</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink>20</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext label="Next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

export const SinglePage: Story = {
  render: () => <PaginationDemo pageCount={1} />,
}

export const ManyPages: Story = {
  render: () => <PaginationDemo pageCount={10} />,
}
