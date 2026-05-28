/**
 * Composable for accessing the global API instance with auto case conversion
 */
export function useApi() {
  const { $api, $apiRaw } = useNuxtApp()

  return {
    // Main API with auto snake_case/camelCase conversion
    api: $api as typeof $fetch,
    // Raw API without conversion (for special cases)
    apiRaw: $apiRaw as typeof $fetch,
  }
}
