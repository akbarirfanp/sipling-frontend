import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { beforeAll, vi } from 'vitest'
import './mocks/server'

// Setup Nuxt test environment with proper context
beforeAll(async () => {
  // Register test endpoints for better API mocking
  registerEndpoint('/api/test', () => ({ message: 'Test endpoint working' }))
})

// Global test utilities
beforeAll(() => {
  // Mock console.warn to suppress noisy warnings
  globalThis.console = {
    ...console,
    // Suppress console.warn for cleaner test output
    warn: vi.fn(),
  }
})

// Mock global objects for testing environment
globalThis.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
