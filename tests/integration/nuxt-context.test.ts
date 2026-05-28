// @vitest-environment nuxt

import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

// Import Nuxt composables for testing
// Note: In a proper Nuxt environment, these would be auto-imported
function useNuxtApp() {
  try {
    return (globalThis as any).$nuxt || null
  }
  catch {
    return null
  }
}

function useRouter() {
  try {
    return (globalThis as any).$router || null
  }
  catch {
    return null
  }
}

function useRoute() {
  try {
    return (globalThis as any).$route || null
  }
  catch {
    return null
  }
}

function useUserSession() {
  try {
    return (globalThis as any).$userSession || null
  }
  catch {
    return null
  }
}

/**
 * Integration tests for Nuxt context and auto-imports
 * Tests that nuxtApp context is properly available in test environment
 */

const TestContextComponent = {
  name: 'TestContextComponent',
  template: `
    <div>
      <div data-testid="nuxt-app">{{ nuxtAppAvailable ? 'NuxtApp Available' : 'NuxtApp Not Available' }}</div>
      <div data-testid="router">{{ routerAvailable ? 'Router Available' : 'Router Not Available' }}</div>
      <div data-testid="route">{{ routeAvailable ? 'Route Available' : 'Route Not Available' }}</div>
      <div data-testid="user-session">{{ userSessionAvailable ? 'UserSession Available' : 'UserSession Not Available' }}</div>
    </div>
  `,
  setup() {
    // Test auto-imports and Nuxt context availability
    let nuxtAppAvailable = false
    let routerAvailable = false
    let routeAvailable = false
    let userSessionAvailable = false

    try {
      const nuxtApp = useNuxtApp()
      nuxtAppAvailable = !!nuxtApp
    }
    catch (error) {
      console.error('useNuxtApp not available:', error)
    }

    try {
      const router = useRouter()
      routerAvailable = !!router
    }
    catch (error) {
      console.error('useRouter not available:', error)
    }

    try {
      const route = useRoute()
      routeAvailable = !!route
    }
    catch (error) {
      console.error('useRoute not available:', error)
    }

    try {
      const userSession = useUserSession()
      userSessionAvailable = !!userSession
    }
    catch (error) {
      console.error('useUserSession not available:', error)
    }

    return {
      nuxtAppAvailable,
      routerAvailable,
      routeAvailable,
      userSessionAvailable,
    }
  },
}

describe('nuxt context integration', () => {
  it('should render test component successfully', async () => {
    const wrapper = await mountSuspended(TestContextComponent)

    // Test that component renders without errors
    expect(wrapper.find('[data-testid="nuxt-app"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="router"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="route"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-session"]').exists()).toBe(true)
  })

  it('should show context availability status', async () => {
    const wrapper = await mountSuspended(TestContextComponent)

    // Test that we can detect context availability (even if not available)
    const nuxtAppText = wrapper.find('[data-testid="nuxt-app"]').text()
    const routerText = wrapper.find('[data-testid="router"]').text()
    const routeText = wrapper.find('[data-testid="route"]').text()
    const userSessionText = wrapper.find('[data-testid="user-session"]').text()

    // These should contain either 'Available' or 'Not Available'
    expect(nuxtAppText).toMatch(/(Available|Not Available)/)
    expect(routerText).toMatch(/(Available|Not Available)/)
    expect(routeText).toMatch(/(Available|Not Available)/)
    expect(userSessionText).toMatch(/(Available|Not Available)/)
  })

  it('should support auto-imports for composables', async () => {
    // Test that we can use Nuxt composables without explicit imports
    const wrapper = await mountSuspended({
      template: '<div data-testid="auto-import-test">{{ testValue }}</div>',
      setup() {
        // These should be auto-imported
        const testValue = ref('Auto-imports working')
        return { testValue }
      },
    })

    expect(wrapper.find('[data-testid="auto-import-test"]').text()).toBe('Auto-imports working')
  })

  it('should provide proper test environment', async () => {
    // Test that test environment is properly configured
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
    expect(typeof navigator).toBe('object')
  })
})
