// composables/createCrudQuery.ts
import type {
  QueryClient,
  QueryKey,
  UseQueryOptions,
} from '@tanstack/vue-query'

import {
  keepPreviousData,
} from '@tanstack/vue-query'

/**
 * Generic repo shape (CRUD + optional extra actions).
 * Cocokin sama interface repo lu; minimal method di bawah harus ada.
 */
/**
 * Repo generic: LData = shape hasil list (mis. { data: T[]; meta: {...} })
 */
export interface CrudRepo<
  T,
  LParams = unknown,
  LData = unknown,
  CCmd = unknown,
  UCmd = Partial<CCmd>,
> {
  list: (params?: LParams) => Promise<LData>
  get: (id: string) => Promise<T>
  create: (cmd: CCmd) => Promise<T>
  update: (id: string, cmd: UCmd) => Promise<T>
  delete: (id: string) => Promise<void>
}

/**
 * Utilities buat bikin queryKey yang konsisten
 */
const qk = (...parts: QueryKey) => parts as QueryKey

/**
 * Factory: hasilnya kumpulan composables (list/detail/mutations + helpers)
 */
export function createCrudQuery<T, LParams, LData, CCmd, UCmd>(
  entityKey: string,
  repo: CrudRepo<T, LParams, LData, CCmd, UCmd>,
) {
  const baseKey = [entityKey] as const

  // LIST (support pagination/filter). v5: pakai placeholderData: keepPreviousData biar gak flicker.
  function useListQuery(
    params?: MaybeRefOrGetter<LParams | undefined>,
    options?: Omit<UseQueryOptions<LData, unknown, LData, QueryKey>, 'queryKey' | 'queryFn'>,
  ) {
    const key = computed(() => qk(...baseKey, 'list', toValue(params) ?? {}))
    return useQuery<LData, unknown, LData, QueryKey>({
      queryKey: key,
      queryFn: () => repo.list(toValue(params)),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      ...(options as any),
    })
  }

  // DETAIL
  function useDetailQuery(
    id: MaybeRefOrGetter<string | undefined>,
    options?: Omit<UseQueryOptions<T, unknown, T, ReturnType<typeof qk>>, 'queryKey' | 'queryFn'>,
  ) {
    return useQuery<T, unknown, T, ReturnType<typeof qk>>({
      queryKey: qk(...baseKey, 'detail', toValue(id) ?? 'nil'),
      queryFn: () => {
        const v = toValue(id)
        if (!v)
          throw new Error('Missing id')
        return repo.get(v)
      },
      enabled: () => !!toValue(id),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      ...(options as any),
    })
  }

  // MUTATIONS
  function useCreateMutation() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (cmd: CCmd) => repo.create(cmd),
      onSuccess: async (response: any) => {
        // Mutate existing cache dengan data baru dari response
        qc.setQueriesData(
          {
            queryKey: [...baseKey, 'list'],
          },
          (oldData: any) => {
            if (!oldData?.items)
              return oldData
            // Tambah item baru ke awal array
            const newData = {
              ...oldData,
              items: [response, ...oldData.items],
              total: (oldData.total || 0) + 1,
            }
            return newData
          },
        )
      },
    })
  }

  function useUpdateMutation(_id?: string) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (payload: { id: string, cmd: UCmd }) => repo.update(payload.id, payload.cmd),
      onSuccess: async (_data, variables) => {
        // invalidasi detail yg barusan diupdate + list
        await Promise.all([
          invalidateDetail(qc, variables.id),
          invalidateList(qc),
        ])
      },
    })
  }

  function useDeleteMutation() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => repo.delete(id),
      onSuccess: async (_data, id) => {
        await Promise.all([
          invalidateDetail(qc, id),
          invalidateList(qc),
        ])
      },
    })
  }

  // HELPERS
  async function invalidateList(qc: QueryClient) {
    await qc.invalidateQueries({ queryKey: qk(...baseKey, 'list') })
  }
  async function invalidateDetail(qc: QueryClient, id: string) {
    await qc.invalidateQueries({ queryKey: qk(...baseKey, 'detail', id) })
  }
  async function prefetchList(qc: QueryClient, params?: LParams) {
    await qc.prefetchQuery({
      queryKey: qk(...baseKey, 'list', params ?? {}),
      queryFn: () => repo.list(params),
    })
  }
  async function prefetchDetail(qc: QueryClient, id: string) {
    await qc.prefetchQuery({
      queryKey: qk(...baseKey, 'detail', id),
      queryFn: () => repo.get(id),
    })
  }

  return {
    keys: {
      base: baseKey,
      list: (params?: LParams) => qk(...baseKey, 'list', params ?? {}),
      detail: (id: string) => qk(...baseKey, 'detail', id),
    },
    useListQuery,
    useDetailQuery,
    useCreateMutation,
    useUpdateMutation,
    useDeleteMutation,
    invalidateList,
    invalidateDetail,
    prefetchList,
    prefetchDetail,
  }
}
