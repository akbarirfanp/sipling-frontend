import type { QueryKey, UseMutationOptions, UseQueryOptions } from '@tanstack/vue-query'
import type { FetchOptions } from 'ofetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

/**
 * Enhanced API composable with Vue Query integration
 * Provides smart caching, background updates, and better UX
 */
export function useVueQuery() {
  const { api, apiRaw } = useApi()
  const queryClient = useQueryClient()

  /**
   * Query wrapper dengan Vue Query untuk GET requests
   * @param key - Query key untuk caching
   * @param url - API endpoint
   * @param options - Vue Query options
   * @param fetchOptions - Ofetch options
   */
  function createQuery<TData = any>(
    key: QueryKey,
    url: string,
    options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>,
    fetchOptions?: FetchOptions,
  ) {
    return useQuery({
      queryKey: key,
      queryFn: async () => {
        const response = await api(url, { ...fetchOptions, method: 'GET' })
        return response as TData
      },
      ...options,
    })
  }

  /**
   * Mutation wrapper dengan Vue Query untuk POST/PUT/DELETE requests
   * @param mutationFn
   * @param options - Vue Query mutation options
   */
  function createMutation<TData = any, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
  ) {
    return useMutation({
      mutationFn,
      ...options,
    })
  }

  /**
   * Helper untuk invalidate queries berdasarkan key pattern
   * @param keyPattern - Query key pattern untuk invalidate
   */
  function invalidateQueries(keyPattern: QueryKey) {
    return queryClient.invalidateQueries({ queryKey: keyPattern })
  }

  /**
   * Helper untuk set query data secara manual (optimistic updates)
   * @param key - Query key
   * @param data - Data baru
   */
  function setQueryData<TData>(key: QueryKey, data: TData) {
    return queryClient.setQueryData(key, data)
  }

  /**
   * Helper untuk get query data dari cache
   * @param key - Query key
   */
  function getQueryData<TData>(key: QueryKey): TData | undefined {
    return queryClient.getQueryData(key)
  }

  /**
   * Helper untuk prefetch data
   * @param key - Query key
   * @param url - API endpoint
   * @param fetchOptions - Ofetch options
   */
  async function prefetchQuery<TData = any>(
    key: QueryKey,
    url: string,
    fetchOptions?: FetchOptions,
  ) {
    return queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => {
        const response = await api(url, { ...fetchOptions, method: 'GET' })
        return response as TData
      },
    })
  }

  /**
   * Shorthand untuk common CRUD operations
   */
  const crud = {
    /**
     * GET request dengan caching
     */
    get: <TData = any>(
      key: QueryKey,
      url: string,
      options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>,
    ) => createQuery<TData>(key, url, options),

    /**
     * POST request dengan mutation
     */
    post: <TData = any, TVariables = any>(
      url: string,
      options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
    ) => createMutation<TData, TVariables>(
      async (variables) => {
        const response = await api(url, {
          method: 'POST',
          body: variables as Record<string, any>,
        })
        return response as TData
      },
      options,
    ),

    /**
     * PUT request dengan mutation
     */
    put: <TData = any, TVariables = any>(
      url: string,
      options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
    ) => createMutation<TData, TVariables>(
      async (variables) => {
        const response = await api(url, {
          method: 'PUT',
          body: variables as Record<string, any>,
        })
        return response as TData
      },
      options,
    ),

    /**
     * DELETE request dengan mutation
     */
    delete: <TData = any, TVariables = any>(
      url: string,
      options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
    ) => createMutation<TData, TVariables>(
      async (variables) => {
        const response = await api(url, {
          method: 'DELETE',
          body: variables as Record<string, any>,
        })
        return response as TData
      },
      options,
    ),
  }

  return {
    // Vue Query methods
    createQuery,
    createMutation,
    invalidateQueries,
    setQueryData,
    getQueryData,
    prefetchQuery,
    crud,

    // Query client untuk advanced usage
    queryClient,

    // Backward compatibility - original API methods
    api,
    apiRaw,
  }
}

/**
 * Shorthand untuk useVueQuery().crud
 * Provides quick access to common CRUD operations
 */
export function useApiQuery() {
  return useVueQuery().crud
}

/**
 * Type helpers untuk Vue Query
 */
export type VueQueryOptions<TData> = Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
export type VueMutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
