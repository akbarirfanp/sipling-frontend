/**
 * Composable for component-level permission checking
 * Provides reactive permission checking for UI components
 */
import type { ComputedRef } from 'vue'

export interface UsePermissionsReturn {
  /**
   * Check if user has permission for a specific ability
   * @param ability - The ability to check
   * @returns Promise<boolean> - Whether user has permission
   */
  can: (ability: any) => Promise<boolean>

  /**
   * Check if user does NOT have permission for a specific ability
   * @param ability - The ability to check
   * @returns Promise<boolean> - Whether user lacks permission
   */
  cannot: (ability: any) => Promise<boolean>

  /**
   * Reactive permission checker that updates when user session changes
   * @param ability - The ability to check
   * @returns ComputedRef<boolean> - Reactive permission state
   */
  hasPermission: (ability: any) => ComputedRef<boolean>

  /**
   * Check multiple abilities at once
   * @param abilities - Array of abilities to check
   * @returns Promise<Record<string, boolean>> - Object with ability names as keys and permission status as values
   */
  checkMultiple: (abilities: Record<string, any>) => Promise<Record<string, boolean>>

  /**
   * Check if user has ANY of the provided abilities
   * @param abilities - Array of abilities to check
   * @returns Promise<boolean> - Whether user has at least one permission
   */
  hasAny: (abilities: any[]) => Promise<boolean>

  /**
   * Check if user has ALL of the provided abilities
   * @param abilities - Array of abilities to check
   * @returns Promise<boolean> - Whether user has all permissions
   */
  hasAll: (abilities: any[]) => Promise<boolean>
}

/**
 * Simple permission checker - checks if permission exists in user.permissions array
 */
function checkPermission(ability: string, user: any): boolean {
  if (!user)
    return false

  const permissions = user.permissions || []

  // Direct string match
  if (permissions.includes(ability)) {
    return true
  }

  return false
}

/**
 * Composable for handling permissions in components
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useUserSession()

  /**
   * Check if user has permission for a specific ability
   */
  const can = async (ability: any): Promise<boolean> => {
    if (!user.value)
      return false

    try {
      // Try using allows() if available, fallback to simple check
      if (typeof allows !== 'undefined') {
        return await allows(ability, user.value)
      }
      else {
        // Fallback to simple permission check
        return checkPermission(ability, user.value)
      }
    }
    catch (error) {
      console.warn('Permission check failed, using fallback:', error)
      // Fallback to simple permission check
      return checkPermission(ability, user.value)
    }
  }

  /**
   * Check if user does NOT have permission for a specific ability
   */
  const cannot = async (ability: any): Promise<boolean> => {
    return !(await can(ability))
  }

  /**
   * Reactive permission checker
   * FIXED: Use simple synchronous permission check instead of async allows()
   */
  const hasPermission = (ability: any): ComputedRef<boolean> => {
    return computed(() => {
      if (!user.value)
        return false

      const permissions = (user.value as any).permissions || []
      return permissions.includes(ability)
    })
  }

  /**
   * Check multiple abilities at once
   */
  const checkMultiple = async (abilities: Record<string, any>): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {}

    for (const [key, ability] of Object.entries(abilities)) {
      results[key] = await can(ability)
    }

    return results
  }

  /**
   * Check if user has ANY of the provided abilities
   */
  const hasAny = async (abilities: any[]): Promise<boolean> => {
    for (const ability of abilities) {
      if (await can(ability)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if user has ALL of the provided abilities
   */
  const hasAll = async (abilities: any[]): Promise<boolean> => {
    for (const ability of abilities) {
      if (!(await can(ability))) {
        return false
      }
    }
    return true
  }

  return {
    can,
    cannot,
    hasPermission,
    checkMultiple,
    hasAny,
    hasAll,
  }
}

/**
 * Utility function to create permission-based computed properties
 * @param abilities - Object with ability names as keys and abilities as values
 * @returns Object with reactive permission states (plain object, auto-unwraps in template)
 */
export function usePermissionStates(abilities: Record<string, any>) {
  const { hasPermission } = usePermissions()

  const permissions: Record<string, ComputedRef<boolean>> = {}

  for (const [key, ability] of Object.entries(abilities)) {
    // hasPermission now returns a ComputedRef directly
    permissions[key] = hasPermission(ability)
  }

  return permissions
}

/**
 * Utility function for role-based UI rendering
 * @param roles - Array of role names to check
 * @returns Reactive boolean indicating if user has any of the roles
 */
export function useRoleCheck(roles: string[]) {
  const { user } = useUserSession()

  return computed(() => {
    if (!user.value?.roles)
      return false

    // ✅ Handle both single object dan array
    const userRoles = Array.isArray(user.value.roles)
      ? user.value.roles
      : [user.value.roles]

    return roles.some(role =>
      userRoles.some((userRole: any) =>
        userRole.name.toLowerCase() === role.toLowerCase(),
      ),
    )
  })
}

// ✅ Tambah helper khusus role Sipling
export function useIsAdmin() {
  const { user } = useUserSession()
  return computed(() => {
    const roles = user.value?.roles
    if (!roles) return false
    const roleObj = Array.isArray(roles) ? roles : [roles]
    return roleObj.some((r: any) => r.name === 'Admin')
  })
}

export function useIsWarga() {
  const { user } = useUserSession()
  return computed(() => {
    const roles = user.value?.roles
    if (!roles) return false
    const roleObj = Array.isArray(roles) ? roles : [roles]
    return roleObj.some((r: any) => r.name === 'Warga')
  })
}

/**
 * Utility function for permission-based UI rendering
 * @param permissions - Array of permission names to check
 * @returns Reactive boolean indicating if user has any of the permissions
 */
export function usePermissionCheck(permissions: string[]) {
  const { user } = useUserSession()

  return computed(() => {
    if (!user.value)
      return false

    // Check if user has permissions property (extend User type as needed)
    const userPermissions = (user.value as any).permissions
    if (!userPermissions)
      return false

    return permissions.some(permission =>
      userPermissions.includes(permission),
    )
  })
}

/**
 * Contact-specific permissions helper
 * Returns cached computed refs for each contact permission that auto-unwrap in templates
 *
 * FIXED: Use singleton pattern to ensure permissions are only created once
 * and use simple permission checking that directly reads from user.permissions array
 */