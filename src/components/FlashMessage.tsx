'use client'

import { useEffect, useState } from 'react'

interface Props {
  message: string
}

export default function FlashMessage({ message }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[var(--color-text)] text-[var(--color-surface)] text-sm shadow-lg animate-fade-in">
      {message}
    </div>
  )
}
