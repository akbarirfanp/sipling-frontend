import type {
  ColumnFiltersState,
  SortingState,
} from '@tanstack/vue-table'

export interface UseTableWithUrlOptions<T> extends UseTableOptions<T> {
  /**
   * Enable URL query params sync
   * @default true
   */
  urlSync?: boolean

  /**
   * Unique identifier for the table to prevent conflicts
   * when multiple tables exist on the same page
   */
  tableId?: string

  /**
   * Custom query param names
   */
  queryParamNames?: {
    page?: string
    pageSize?: string
    search?: string
    sortBy?: string
    sortOrder?: string
    filters?: string
  }
}

export interface UseTableWithUrlReturn<T> extends UseTableReturn<T> {
  // URL sync utilities
  updateUrlQuery: () => void
  syncFromUrl: () => void
  clearTableUrlParams: () => void
}

/**
 * Enhanced useTable with URL query params synchronization
 * Extends the base useTable composable with URL state management
 */
export function useTableWithUrl<T = any>(options: UseTableWithUrlOptions<T>): UseTableWithUrlReturn<T> {
  const {
    urlSync = true,
    tableId,
    queryParamNames = {},
    ...tableOptions
  } = options

  // Create prefixed param names based on tableId
  const createParamName = (baseName: string): string => {
    return tableId ? `${tableId}_${baseName}` : baseName
  }

  // Default query param names with optional tableId prefix
  const paramNames = {
    page: createParamName(queryParamNames.page || 'page'),
    pageSize: createParamName(queryParamNames.pageSize || 'pageSize'),
    search: createParamName(queryParamNames.search || 'search'),
    sortBy: createParamName(queryParamNames.sortBy || 'sortBy'),
    sortOrder: createParamName(queryParamNames.sortOrder || 'sortOrder'),
    filters: createParamName(queryParamNames.filters || 'filters'),
  }

  const route = useRoute()
  const router = useRouter()
  const initPage = Math.max(1, Number(route.query[paramNames.page]) || 1)
  const initPageSize = Math.max(1, Number(route.query[paramNames.pageSize]) || (tableOptions.initialPageSize || 10))
  // const initSearch    = (route.query[paramNames.search] as string) || ''
  const sortBy = route.query[paramNames.sortBy] as string
  const sortOrder = route.query[paramNames.sortOrder] as string
  const initSorting: SortingState
    = sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []

  const reserved = new Set(Object.values(paramNames))
  const initFilters: ColumnFiltersState = []
  Object.entries(route.query).forEach(([k, v]) => {
    if (!reserved.has(k) && v) {
      initFilters.push({ id: k, value: Array.isArray(v) ? v[0] : v })
    }
  })

  // Get base table functionality
  const tableReturn = useTable<T>({
    ...tableOptions,
    initialPage: tableOptions.initialPage ?? (initPage - 1),
    initialPageSize: tableOptions.initialPageSize ?? initPageSize,
    initialSorting: tableOptions.initialSorting ?? initSorting.map(sort => ({
      field: sort.id,
      direction: sort.desc ? 'desc' : 'asc',
    })),
    initialFilters: (tableOptions as any).initialColumnFilters ?? initFilters,
  })

  const {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPageIndex,
    setPageSize,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
  } = tableReturn

  // 🛡️ anti ping-pong antara watch(route.query) dan watch(state)
  const isApplyingFromUrl = ref(false)
  const isUpdatingUrl = ref(false)

  // URL sync functions
  const updateUrlQuery = () => {
    if (!urlSync || isApplyingFromUrl.value)
      return

    const next: Record<string, string | undefined> = {}
    // copy existing (stringify array -> first)
    for (const [k, v] of Object.entries(route.query)) {
      if (typeof v === 'string')
        next[k] = v
      else if (Array.isArray(v) && v.length && typeof v[0] === 'string')
        next[k] = v[0]
    }

    // page
    next[paramNames.page] = pagination.value.pageIndex > 0 ? String(pagination.value.pageIndex + 1) : undefined
    // pageSize (only if differs from default)
    const defaultPageSize = tableOptions.initialPageSize || 10
    next[paramNames.pageSize] = pagination.value.pageSize !== defaultPageSize ? String(pagination.value.pageSize) : undefined
    // search
    next[paramNames.search] = globalFilter.value || undefined
    // sorting
    if (sorting.value.length > 0) {
      const s = sorting.value[0]
      next[paramNames.sortBy] = s?.id
      next[paramNames.sortOrder] = s?.desc ? 'desc' : 'asc'
    }
    else {
      next[paramNames.sortBy] = undefined
      next[paramNames.sortOrder] = undefined
    }
    // filters flatten
    // hapus dulu semua filter lama di next yang bukan reserved:
    for (const key of Object.keys(next)) {
      if (!reserved.has(key))
        delete next[key]
    }
    for (const f of columnFilters.value) {
      next[f.id] = String(f.value)
    }

    // replace hanya kalau beda
    const a = JSON.stringify(route.query)
    const b = JSON.stringify(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)))
    if (a !== b) {
      isUpdatingUrl.value = true
      router.replace({ query: next as Record<string, string> }).finally(() => {
        isUpdatingUrl.value = false
      })
    }
  }

  const syncFromUrl = () => {
    if (!urlSync)
      return
    const q = route.query

    const page = Math.max(1, Number(q[paramNames.page]) || 1)
    const pageSize = Math.max(1, Number(q[paramNames.pageSize]) || (tableOptions.initialPageSize || 10))

    isApplyingFromUrl.value = true
    if (pagination.value.pageIndex !== page - 1)
      setPageIndex(page - 1)
    if (pagination.value.pageSize !== pageSize)
      setPageSize(pageSize)

    const search = (q[paramNames.search] as string) || ''
    if (globalFilter.value !== search)
      setGlobalFilter(search)

    const sb = q[paramNames.sortBy] as string
    const so = q[paramNames.sortOrder] as string
    const newSorting: SortingState = sb && so ? [{ id: sb, desc: so === 'desc' }] : []
    if (JSON.stringify(sorting.value) !== JSON.stringify(newSorting))
      setSorting(newSorting)

    const newFilters: ColumnFiltersState = []
    Object.entries(q).forEach(([k, v]) => {
      if (!reserved.has(k) && v)
        newFilters.push({ id: k, value: Array.isArray(v) ? v[0] : v })
    })
    if (JSON.stringify(columnFilters.value) !== JSON.stringify(newFilters))
      setColumnFilters(newFilters)

    isApplyingFromUrl.value = false
  }

  // Clear URL params for this specific table
  const clearTableUrlParams = () => {
    if (!urlSync)
      return

    const query = { ...route.query }

    // Remove this table's params
    delete query[paramNames.page]
    delete query[paramNames.pageSize]
    delete query[paramNames.search]
    delete query[paramNames.sortBy]
    delete query[paramNames.sortOrder]

    // Remove filter params
    const filterPrefix = tableId ? `${tableId}_filter_` : 'filter_'
    Object.keys(query).forEach((key) => {
      if (key.startsWith(filterPrefix)) {
        delete query[key]
      }
    })

    router.replace({ query: query as Record<string, string> })
  }

  // Watch for route changes and sync state
  watch(() => route.query, () => {
    if (isUpdatingUrl.value)
      return
    syncFromUrl()
  }, { deep: true })

  // Watch for state changes and update URL
  watch(
    [pagination, sorting, columnFilters, globalFilter],
    () => {
      updateUrlQuery()
    },
    { deep: true },
  )

  // Enhanced action functions that also update URL
  const enhancedSetPageIndex = (pageIndex: number) => {
    setPageIndex(pageIndex)
  }

  const enhancedSetPageSize = (pageSize: number) => {
    setPageSize(pageSize)
  }

  const enhancedSetSorting = (newSorting: SortingState) => {
    setSorting(newSorting)
  }

  const enhancedSetColumnFilters = (filters: ColumnFiltersState) => {
    setColumnFilters(filters)
  }

  const enhancedSetGlobalFilter = (filter: string) => {
    setGlobalFilter(filter)
  }

  return {
    ...tableReturn,
    // Override action functions
    setPageIndex: enhancedSetPageIndex,
    setPageSize: enhancedSetPageSize,
    setSorting: enhancedSetSorting,
    setColumnFilters: enhancedSetColumnFilters,
    setGlobalFilter: enhancedSetGlobalFilter,
    // URL sync utilities
    updateUrlQuery,
    syncFromUrl,
    clearTableUrlParams,
  }
}
