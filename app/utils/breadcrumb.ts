import type { RouteLocationNormalized } from 'vue-router'
import type { BreadcrumbItem } from '~/composables/useBreadcrumb'

/**
 * Utility functions untuk breadcrumb formatting dan navigation
 */

// Interface untuk route meta breadcrumb
export interface RouteBreadcrumbMeta {
  breadcrumb?: BreadcrumbItem[] | BreadcrumbItem | string
  breadcrumbLabel?: string
  breadcrumbIcon?: string
  breadcrumbDisabled?: boolean
  hiddenFromBreadcrumb?: boolean
}

// Extend RouteLocationNormalized untuk include breadcrumb meta
declare module 'vue-router' {
  interface RouteMeta extends RouteBreadcrumbMeta {}
}

/**
 * Generate breadcrumb items dari route path segments
 */
export function generateBreadcrumbFromPath(
  route: RouteLocationNormalized,
  options: {
    homeLabel?: string
    homeTo?: string
    includeHome?: boolean
    formatLabel?: (segment: string, fullPath: string) => string
  } = {},
): BreadcrumbItem[] {
  const {
    homeLabel = 'Home',
    homeTo = '/',
    includeHome = true,
    formatLabel = defaultFormatLabel,
  } = options

  const items: BreadcrumbItem[] = []

  // Add home item
  if (includeHome) {
    items.push({
      label: homeLabel,
      to: homeTo,
      active: route.path === homeTo,
    })
  }

  // Generate dari path segments
  const pathSegments = route.path.split('/').filter(Boolean)
  let currentPath = ''

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip home jika udah ada
    if (includeHome && currentPath === homeTo)
      return

    const isLast = index === pathSegments.length - 1
    const label = formatLabel(segment, currentPath)

    items.push({
      label,
      to: isLast ? undefined : currentPath,
      active: isLast,
    })
  })

  return items
}

/**
 * Generate breadcrumb items dari route meta
 */
export function generateBreadcrumbFromMeta(
  route: RouteLocationNormalized,
  options: {
    homeLabel?: string
    homeTo?: string
    includeHome?: boolean
  } = {},
): BreadcrumbItem[] {
  const {
    homeLabel = 'Home',
    homeTo = '/',
    includeHome = true,
  } = options

  const items: BreadcrumbItem[] = []

  // Add home item
  if (includeHome) {
    items.push({
      label: homeLabel,
      to: homeTo,
      active: route.path === homeTo,
    })
  }

  // Process route meta breadcrumb
  if (route.meta?.breadcrumb) {
    const metaBreadcrumb = route.meta.breadcrumb

    if (Array.isArray(metaBreadcrumb)) {
      // Array of breadcrumb items
      items.push(...metaBreadcrumb.map((item, index) => ({
        ...item,
        active: index === metaBreadcrumb.length - 1,
      })))
    }
    else if (typeof metaBreadcrumb === 'string') {
      // Simple string label
      items.push({
        label: metaBreadcrumb,
        active: true,
      })
    }
    else {
      // Single breadcrumb item
      items.push({
        ...metaBreadcrumb,
        active: true,
      })
    }
  }
  else {
    // Fallback ke route name atau path
    const label = route.meta?.breadcrumbLabel
      || (route.name as string)
      || defaultFormatLabel(route.path.split('/').pop() || '', route.path)

    items.push({
      label,
      icon: route.meta?.breadcrumbIcon,
      disabled: route.meta?.breadcrumbDisabled,
      active: true,
    })
  }

  return items
}

/**
 * Generate breadcrumb items dari matched routes (untuk nested routes)
 */
export function generateBreadcrumbFromMatched(
  route: RouteLocationNormalized,
  options: {
    homeLabel?: string
    homeTo?: string
    includeHome?: boolean
    skipHidden?: boolean
  } = {},
): BreadcrumbItem[] {
  const {
    homeLabel = 'Home',
    homeTo = '/',
    includeHome = true,
    skipHidden = true,
  } = options

  const items: BreadcrumbItem[] = []

  // Add home item
  if (includeHome) {
    items.push({
      label: homeLabel,
      to: homeTo,
      active: route.path === homeTo,
    })
  }

  // Process matched routes
  const matchedRoutes = route.matched.filter((matchedRoute) => {
    // Skip hidden routes
    if (skipHidden && matchedRoute.meta?.hiddenFromBreadcrumb) {
      return false
    }

    // Skip routes without name or path
    if (!matchedRoute.name && !matchedRoute.path) {
      return false
    }

    return true
  })

  matchedRoutes.forEach((matchedRoute, index) => {
    const isLast = index === matchedRoutes.length - 1

    // Get label dari meta atau route name
    const label = matchedRoute.meta?.breadcrumbLabel
      || (matchedRoute.name as string)
      || defaultFormatLabel(matchedRoute.path.split('/').pop() || '', matchedRoute.path)

    // Skip home jika udah ada
    if (includeHome && matchedRoute.path === homeTo)
      return

    items.push({
      label,
      to: isLast ? undefined : matchedRoute.path,
      icon: matchedRoute.meta?.breadcrumbIcon,
      disabled: matchedRoute.meta?.breadcrumbDisabled,
      active: isLast,
    })
  })

  return items
}

/**
 * Smart breadcrumb generation yang combine semua strategies
 */
export function generateSmartBreadcrumb(
  route: RouteLocationNormalized,
  options: {
    homeLabel?: string
    homeTo?: string
    includeHome?: boolean
    strategy?: 'meta' | 'path' | 'matched' | 'auto'
    formatLabel?: (segment: string, fullPath: string) => string
  } = {},
): BreadcrumbItem[] {
  const {
    strategy = 'auto',
    ...restOptions
  } = options

  // Auto strategy: pilih yang terbaik berdasarkan route
  if (strategy === 'auto') {
    // Prioritas: meta > matched > path
    if (route.meta?.breadcrumb) {
      return generateBreadcrumbFromMeta(route, restOptions)
    }
    else if (route.matched.length > 1) {
      return generateBreadcrumbFromMatched(route, restOptions)
    }
    else {
      return generateBreadcrumbFromPath(route, restOptions)
    }
  }

  // Specific strategy
  switch (strategy) {
    case 'meta':
      return generateBreadcrumbFromMeta(route, restOptions)
    case 'matched':
      return generateBreadcrumbFromMatched(route, restOptions)
    case 'path':
    default:
      return generateBreadcrumbFromPath(route, restOptions)
  }
}

/**
 * Default label formatter
 */
export function defaultFormatLabel(segment: string, _fullPath?: string): string {
  // Handle dynamic segments
  if (segment.startsWith(':')) {
    return segment.slice(1).charAt(0).toUpperCase() + segment.slice(2)
  }

  // Handle kebab-case dan snake_case
  return segment
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format breadcrumb path sebagai string
 */
export function formatBreadcrumbPath(
  items: BreadcrumbItem[],
  separator: string = ' > ',
): string {
  return items
    .filter(item => !item.disabled)
    .map(item => item.label)
    .join(separator)
}

/**
 * Get breadcrumb item by index
 */
export function getBreadcrumbItem(
  items: BreadcrumbItem[],
  index: number,
): BreadcrumbItem | undefined {
  return items[index]
}

/**
 * Get active breadcrumb item
 */
export function getActiveBreadcrumbItem(
  items: BreadcrumbItem[],
): BreadcrumbItem | undefined {
  return items.find(item => item.active) || items[items.length - 1]
}

/**
 * Check if breadcrumb item is navigable
 */
export function isNavigableBreadcrumbItem(item: BreadcrumbItem): boolean {
  return !item.disabled && !item.active && (!!item.to || !!item.href)
}

/**
 * Truncate breadcrumb items untuk responsive display
 */
export function truncateBreadcrumbItems(
  items: BreadcrumbItem[],
  maxItems: number,
  ellipsisLabel: string = '...',
): BreadcrumbItem[] {
  if (items.length <= maxItems) {
    return items
  }

  const firstItems = items.slice(0, 1)
  const lastItems = items.slice(-(maxItems - 2))
  const hiddenItems = items.slice(1, -(maxItems - 2))

  return [
    ...firstItems,
    {
      label: ellipsisLabel,
      disabled: true,
      // Store hidden items untuk dropdown
      hiddenItems,
    } as BreadcrumbItem & { hiddenItems: BreadcrumbItem[] },
    ...lastItems,
  ]
}

/**
 * Validate breadcrumb item
 */
export function validateBreadcrumbItem(item: BreadcrumbItem): boolean {
  return !!item.label && typeof item.label === 'string'
}

/**
 * Clean breadcrumb items (remove invalid items)
 */
export function cleanBreadcrumbItems(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items.filter(validateBreadcrumbItem)
}
