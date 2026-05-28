/**
 * Convert snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert camelCase string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
export function convertKeysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key)
      converted[camelKey] = convertKeysToCamelCase(value)
    }

    return converted as T
  }

  return obj
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
export function convertKeysToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key)
      converted[snakeKey] = convertKeysToSnakeCase(value)
    }

    return converted as T
  }

  return obj
}

export function parsePhoneToE164(phone?: string | null): string {
  if (!phone)
    return ''
  const cleaned = phone.replace(/[()]/g, '').replace(/^\+?(\d+)/, '+$1')
  return cleaned
}
