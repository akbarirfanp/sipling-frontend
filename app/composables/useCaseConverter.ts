import { convertKeysToCamelCase, convertKeysToSnakeCase, toCamelCase, toSnakeCase } from '~/utils/case-converter'

/**
 * Composable for case conversion utilities
 * Useful for manual data transformation when needed
 */
export function useCaseConverter() {
  return {
    // String converters
    toCamelCase,
    toSnakeCase,

    // Object converters
    convertKeysToCamelCase,
    convertKeysToSnakeCase,

    // Alias for easier usage
    camelCase: convertKeysToCamelCase,
    snakeCase: convertKeysToSnakeCase,
  }
}
