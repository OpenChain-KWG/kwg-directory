import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom lacks ResizeObserver. cmdk and TanStack Virtual both rely on it, so
// install a no-op polyfill globally for unit tests.
class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!('ResizeObserver' in globalThis)) {
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverPolyfill }).ResizeObserver =
    ResizeObserverPolyfill
}

// jsdom lacks scrollIntoView used by cmdk highlight effects.
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {}
}

// Supabase 클라이언트 전역 mock
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))
