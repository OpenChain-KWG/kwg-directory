'use client'

import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { formatNumber } from '@/lib/format'

interface Props {
  value: number
  duration?: number
}

function easeOut(t: number): number {
  // cubic-bezier(0.16, 1, 0.3, 1) approximation
  return 1 - Math.pow(1 - t, 3)
}

export default function StatCounter({ value, duration = 1200 }: Props) {
  const locale = useLocale()
  const [displayed, setDisplayed] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          observer.disconnect()

          let start: number | null = null

          function step(timestamp: number) {
            if (!start) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = easeOut(progress)
            setDisplayed(Math.round(easedProgress * value))

            if (progress < 1) {
              requestAnimationFrame(step)
            }
          }

          setDisplayed(0)
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return <span ref={ref}>{formatNumber(displayed, locale)}</span>
}
