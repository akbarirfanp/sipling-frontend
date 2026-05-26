import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type PermissionGroup = 'user' | 'organization' | 'division' | 'role' | 'queue'

export interface TabItem {
  id: string
  label: string
  content?: string
  disabled?: boolean
  closable?: boolean
  icon?: any
  badge?: string | number
  href?: string
  component?: any
  permissionGroup?: PermissionGroup
  permission?: string
}

export interface UseTabsOptions {
  defaultTab?: string
  persistent?: boolean
  storageKey?: string
  urlSync?: boolean
  maxTabs?: number
  onTabChange?: (tabId: string, tab: TabItem) => void
  onTabClose?: (tabId: string, tab: TabItem) => void
  onTabAdd?: (tab: TabItem) => void
}

export interface UseTabsReturn {
  tabs: Readonly<Ref<TabItem[]>>
  activeTab: Readonly<Ref<string | null>>
  currentTab: Readonly<Ref<TabItem | null>>
  addTab: (tab: TabItem) => void
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<TabItem>) => void
  moveTab: (fromIndex: number, toIndex: number) => void
  clearTabs: () => void
  canAddTab: Readonly<Ref<boolean>>
  hasMaxTabs: Readonly<Ref<boolean>>
}

/**
 * Helper function to create a new tab
 */
export function createTab(
  id: string,
  label: string,
  options: Partial<Omit<TabItem, 'id' | 'label'>> = {},
): TabItem {
  return {
    id,
    label,
    content: '',
    disabled: false,
    closable: true,
    ...options,
  }
}

/**
 * Composable for managing tabs with persistence, URL sync, and routing support
 */
export function useTabs(
  initialTabs: TabItem[] = [],
  options: UseTabsOptions = {},
): UseTabsReturn {
  const {
    defaultTab,
    persistent = false,
    storageKey = 'tabs',
    urlSync = false,
    maxTabs = 10,
    onTabChange,
    onTabClose,
    onTabAdd,
  } = options

  const route = useRoute()
  const router = useRouter()

  // Internal state
  const tabs = ref<TabItem[]>([...initialTabs])
  const activeTab = ref<string | null>(null)

  // Computed properties
  const currentTab = computed(() => {
    if (!activeTab.value)
      return null
    return tabs.value.find(tab => tab.id === activeTab.value) || null
  })

  const canAddTab = computed(() => tabs.value.length < maxTabs)
  const hasMaxTabs = computed(() => tabs.value.length >= maxTabs)

  // Storage helpers
  const saveToStorage = () => {
    if (!persistent || typeof window === 'undefined')
      return
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        tabs: tabs.value,
        activeTab: activeTab.value,
      }))
    }
    catch (error) {
      console.warn('Failed to save tabs to localStorage:', error)
    }
  }

  const loadFromStorage = () => {
    if (!persistent || typeof window === 'undefined')
      return null
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : null
    }
    catch (error) {
      console.warn('Failed to load tabs from localStorage:', error)
      return null
    }
  }

  // URL sync helpers
  const syncFromUrl = () => {
    if (!urlSync)
      return
    const tabId = route.query.tab as string
    if (tabId && tabs.value.some(tab => tab.id === tabId)) {
      activeTab.value = tabId
    }
  }

  const syncToUrl = (tabId: string) => {
    if (!urlSync)
      return
    router.replace({ query: { ...route.query, tab: tabId } })
  }

  // Tab management functions
  const setActiveTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab || tab.disabled)
      return

    // Handle routing if tab has href
    if (tab.href) {
      router.push(tab.href)
    }

    activeTab.value = tabId
    onTabChange?.(tabId, tab)
    syncToUrl(tabId)
    saveToStorage()
  }

  const addTab = (tab: TabItem) => {
    if (!canAddTab.value) {
      console.warn('Cannot add tab: maximum tabs reached')
      return
    }

    const existingIndex = tabs.value.findIndex(t => t.id === tab.id)
    if (existingIndex !== -1) {
      // Update existing tab
      tabs.value[existingIndex] = { ...tabs.value[existingIndex], ...tab }
    }
    else {
      // Add new tab
      tabs.value.push(tab)
    }

    setActiveTab(tab.id)
    onTabAdd?.(tab)
    saveToStorage()
  }

  const removeTab = (tabId: string) => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1)
      return

    const tab = tabs.value[tabIndex]
    if (!tab?.closable) {
      console.warn('Cannot close tab: tab is not closable')
      return
    }

    onTabClose?.(tabId, tab)
    tabs.value.splice(tabIndex, 1)

    // Handle active tab change
    if (activeTab.value === tabId) {
      if (tabs.value.length > 0) {
        const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
        const newTab = tabs.value[newActiveIndex]
        if (newTab) {
          setActiveTab(newTab.id)
        }
      }
      else {
        activeTab.value = null
      }
    }

    saveToStorage()
  }

  const updateTab = (tabId: string, updates: Partial<TabItem>) => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
    if (tabIndex !== -1) {
      const currentTab = tabs.value[tabIndex]
      if (currentTab) {
        tabs.value[tabIndex] = { ...currentTab, ...updates }
        saveToStorage()
      }
    }
  }

  const moveTab = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= tabs.value.length
      || toIndex < 0 || toIndex >= tabs.value.length) {
      return
    }

    const tab = tabs.value.splice(fromIndex, 1)[0]
    if (!tab)
      return

    tabs.value.splice(toIndex, 0, tab)
    saveToStorage()
  }

  const clearTabs = () => {
    const closableTabs = tabs.value.filter(tab => tab.closable)
    closableTabs.forEach((tab) => {
      removeTab(tab.id)
    })
  }

  // Route matching helper
  const getActiveTabFromRoute = () => {
    const currentPath = route.path
    return tabs.value.find(tab => tab.href === currentPath)?.id || null
  }

  // Initialize
  const initialize = () => {
    // Load from storage if persistent
    if (persistent) {
      const stored = loadFromStorage()
      if (stored && stored.tabs && Array.isArray(stored.tabs)) {
        tabs.value = stored.tabs
        if (stored.activeTab && tabs.value.some(tab => tab.id === stored.activeTab)) {
          activeTab.value = stored.activeTab
        }
      }
    }

    // Try to match current route to a tab
    const routeMatchedTab = getActiveTabFromRoute()
    if (routeMatchedTab) {
      activeTab.value = routeMatchedTab
    }
    // Set default active tab if no route match
    else if (!activeTab.value && tabs.value.length > 0) {
      const defaultTabId = defaultTab && tabs.value.some(tab => tab.id === defaultTab)
        ? defaultTab
        : tabs.value[0]?.id
      if (defaultTabId) {
        activeTab.value = defaultTabId
      }
    }

    // Sync from URL
    syncFromUrl()
  }

  // Watch for route changes to sync URL
  if (urlSync) {
    watch(() => route.query.tab, (newTabId) => {
      if (newTabId && typeof newTabId === 'string'
        && tabs.value.some(tab => tab.id === newTabId)
        && activeTab.value !== newTabId) {
        activeTab.value = newTabId
      }
    })
  }

  // Watch for route path changes to update active tab
  watch(() => route.path, () => {
    const routeMatchedTab = getActiveTabFromRoute()
    if (routeMatchedTab && activeTab.value !== routeMatchedTab) {
      activeTab.value = routeMatchedTab
    }
  }, { immediate: true })

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  // Cleanup
  onUnmounted(() => {
    // Any cleanup if needed
  })

  return {
    tabs: readonly(tabs) as Readonly<Ref<TabItem[]>>,
    activeTab: readonly(activeTab),
    currentTab,
    addTab,
    removeTab,
    setActiveTab,
    updateTab,
    moveTab,
    clearTabs,
    canAddTab,
    hasMaxTabs,
  }
}
