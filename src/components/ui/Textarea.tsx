'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Render the textarea in an error state. */
  error?: boolean
  /** Auto-resize to content (height grows with input, no scrollbar until max). */
  autoResize?: boolean
}

/** Token-driven multi-line input with optional auto-resize behavior. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      autoResize,
      onInput,
      'aria-invalid': ariaInvalid,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null)

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      },
      [forwardedRef],
    )

    const resize = React.useCallback(() => {
      const el = internalRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [])

    React.useEffect(() => {
      if (autoResize) resize()
    }, [autoResize, resize, props.value])

    return (
      <textarea
        ref={setRefs}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        onInput={(event) => {
          if (autoResize) resize()
          onInput?.(event)
        }}
        className={cn(
          'flex min-h-20 w-full rounded-md px-3 py-2 text-sm',
          'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
          'border border-[var(--color-border-default)]',
          'placeholder:text-[var(--color-text-faint)]',
          'transition-colors duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
          'focus-visible:border-[var(--color-border-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          autoResize ? 'resize-none overflow-hidden' : 'resize-y',
          error &&
            'border-[var(--color-state-danger)] focus-visible:border-[var(--color-state-danger)] focus-visible:ring-[var(--color-danger-200)]',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
