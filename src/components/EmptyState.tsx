import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
  onReset?: () => void
  resetLabel?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  onReset,
  resetLabel = '초기화',
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-[var(--color-text-muted)]">
      <div className="w-12 h-12 mx-auto mb-4 opacity-30" aria-hidden="true">
        {icon}
      </div>
      <p className="text-lg font-semibold text-[var(--color-text)] mb-2">{title}</p>
      {description && (
        <p className="text-sm mb-6">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          {action.label}
        </Link>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
        >
          {resetLabel}
        </button>
      )}
    </div>
  )
}
