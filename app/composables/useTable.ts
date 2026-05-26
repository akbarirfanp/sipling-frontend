import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'

export interface TableData<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TableFilters {
  [key: string]: any
}

export interface TableSorting {
  field: string
  direction: 'asc' | 'desc'
}

export interface UseTableOptions<T> {
  columns: ColumnDef<T>[]
  data?: T[]
  serverSide?: boolean
  initialPageSize?: number
  initialPage?: number
  initialSorting?: TableSorting[]
  initialFilters?: TableFilters
  onServerSideChange?: (params: {
    page: number
    pageSize: number
    sorting: TableSorting[]
    filters: TableFilters
  }) => Promise<TableData<T>>
}

export interface UseTableReturn<T> {
  // Table instance
  table: ReturnType<typeof useVueTable<T>>

  // Data
  data: Readonly<Ref<T[]>>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>

  // Pagination
  pagination: Readonly<Ref<PaginationState>>
  totalPages: Readonly<Ref<number>>
  totalItems: Readonly<Ref<number>>
  canPreviousPage: Readonly<Ref<boolean>>
  canNextPage: Readonly<Ref<boolean>>

  // Sorting
  sorting: Readonly<Ref<SortingState>>

  // Filtering
  columnFilters: Readonly<Ref<ColumnFiltersState>>
  globalFilter: Readonly<Ref<string>>

  // Column visibility
  columnVisibility: Readonly<Ref<VisibilityState>>

  // Actions
  setPageIndex: (pageIndex: number) => void
  setPageSize: (pageSize: number) => void
  nextPage: () => void
  previousPage: () => void
  setSorting: (sorting: SortingState) => void
  setColumnFilters: (filters: ColumnFiltersState) => void
  setGlobalFilter: (filter: string) => void
  setColumnVisibility: (visibility: VisibilityState) => void
  refreshData: () => Promise<void>

  // Utilities
  FlexRender: typeof FlexRender
}

export function useTable<T = any>(options: UseTableOptions<T>): UseTableReturn<T> {
  const {
    columns,
    data: initialData = [],
    serverSide = false,
    initialPageSize = 10,
    initialPage = 0,
    initialSorting = [],
    initialFilters = {},
    onServerSideChange,
  } = options

  // Reactive state
  const data = ref<T[]>(initialData) as Ref<T[]>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Table state
  const pagination = ref<PaginationState>({
    pageIndex: initialPage,
    pageSize: initialPageSize,
  })

  const sorting = ref<SortingState>(
    initialSorting.map(sort => ({
      id: sort.field,
      desc: sort.direction === 'desc',
    })),
  )

  const columnFilters = ref<ColumnFiltersState>(
    Object.entries(initialFilters).map(([key, value]) => ({
      id: key,
      value,
    })),
  )

  const globalFilter = ref('')
  const columnVisibility = ref<VisibilityState>({})

  // Initialize totalItems for client-side tables
  if (!serverSide) {
    totalItems.value = initialData.length
  }

  // Watch for data changes in client-side mode
  watch(
    () => options.data,
    (newData) => {
      if (!serverSide && newData) {
        data.value = newData
        totalItems.value = newData.length
      }
    },
    { deep: true, immediate: true },
  )

  // Computed values
  const canPreviousPage = computed(() => pagination.value.pageIndex > 0)

  const canNextPage = computed(() => {
    if (serverSide) {
      return pagination.value.pageIndex < totalPages.value - 1
    }
    else {
      // For client-side, use table's built-in pagination
      // eslint-disable-next-line ts/no-use-before-define
      return table.getCanNextPage()
    }
  })

  // Convert sorting state to API format
  const apiSorting = computed<TableSorting[]>(() =>
    sorting.value.map(sort => ({
      field: sort.id,
      direction: sort.desc ? 'desc' : 'asc',
    })),
  )

  // Convert column filters to API format
  const apiFilters = computed<TableFilters>(() => {
    const filters: TableFilters = {}
    columnFilters.value.forEach((filter) => {
      filters[filter.id] = filter.value
    })
    if (globalFilter.value) {
      filters.search = globalFilter.value
    }
    return filters
  })

  // Server-side data fetching
  const fetchServerData = async () => {
    if (!serverSide || !onServerSideChange)
      return

    isLoading.value = true
    error.value = null

    try {
      const result = await onServerSideChange({
        page: pagination.value.pageIndex + 1, // API usually uses 1-based indexing
        pageSize: pagination.value.pageSize,
        sorting: apiSorting.value,
        filters: apiFilters.value,
      })
      data.value = result.data
      totalItems.value = result.total
      totalPages.value = result.totalPages
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      console.error('Table data fetch error:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  // Watch for changes that should trigger server-side fetch
  if (serverSide) {
    watch(
      [pagination, sorting, columnFilters, globalFilter],
      () => {
        fetchServerData()
      },
      { deep: true, immediate: true },
    )
  }

  // Create table instance
  const table = useVueTable({
    get data() {
      return data.value
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: serverSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: serverSide ? undefined : getFilteredRowModel(),
    manualPagination: serverSide,
    manualSorting: serverSide,
    manualFiltering: serverSide,
    state: {
      get pagination() {
        return pagination.value
      },
      get sorting() {
        return sorting.value
      },
      get columnFilters() {
        return columnFilters.value
      },
      get globalFilter() {
        return globalFilter.value
      },
      get columnVisibility() {
        return columnVisibility.value
      },
    },
    onPaginationChange: (updater) => {
      const newValue = typeof updater === 'function' ? updater(pagination.value) : updater
      pagination.value = newValue
    },
    onSortingChange: (updater) => {
      const newValue = typeof updater === 'function' ? updater(sorting.value) : updater
      sorting.value = newValue
    },
    onColumnFiltersChange: (updater) => {
      const newValue = typeof updater === 'function' ? updater(columnFilters.value) : updater
      columnFilters.value = newValue
    },
    onGlobalFilterChange: (updater) => {
      const newValue = typeof updater === 'function' ? updater(globalFilter.value) : updater
      globalFilter.value = newValue
    },
    onColumnVisibilityChange: (updater) => {
      const newValue = typeof updater === 'function' ? updater(columnVisibility.value) : updater
      columnVisibility.value = newValue
    },
    // ✅ Fix: Use getter for reactive pageCount
    ...(serverSide && {
      get pageCount() {
        return totalPages.value
      },
    }),
  })

  // Update totalItems for client-side filtering
  watch(
    [data, columnFilters, globalFilter],
    () => {
      if (!serverSide) {
        // For client-side, get filtered row count
        const filteredRows = table.getFilteredRowModel().rows
        totalItems.value = filteredRows.length
      }
    },
    { deep: true },
  )

  // Action functions
  const setPageIndex = (pageIndex: number) => {
    pagination.value = { ...pagination.value, pageIndex }
  }

  const setPageSize = (pageSize: number) => {
    pagination.value = { pageIndex: 0, pageSize }
  }

  const nextPage = () => {
    if (canNextPage.value) {
      setPageIndex(pagination.value.pageIndex + 1)
    }
  }

  const previousPage = () => {
    if (canPreviousPage.value) {
      setPageIndex(pagination.value.pageIndex - 1)
    }
  }

  const setSorting = (newSorting: SortingState) => {
    sorting.value = newSorting
  }

  const setColumnFilters = (filters: ColumnFiltersState) => {
    columnFilters.value = filters
    // Reset to first page when filters change
    if (pagination.value.pageIndex > 0) {
      setPageIndex(0)
    }
  }

  const setGlobalFilter = (filter: string) => {
    globalFilter.value = filter
    // Reset to first page when global filter changes
    if (pagination.value.pageIndex > 0) {
      setPageIndex(0)
    }
  }

  const setColumnVisibility = (visibility: VisibilityState) => {
    columnVisibility.value = visibility
  }

  const refreshData = async () => {
    if (serverSide) {
      await fetchServerData()
    }
  }

  return {
    table,
    data: data as Readonly<Ref<T[]>>,
    isLoading: isLoading as Readonly<Ref<boolean>>,
    error: error as Readonly<Ref<string | null>>,
    pagination: pagination as Readonly<Ref<PaginationState>>,
    totalPages: totalPages as Readonly<Ref<number>>,
    totalItems: totalItems as Readonly<Ref<number>>,
    canPreviousPage,
    canNextPage,
    sorting: sorting as Readonly<Ref<SortingState>>,
    columnFilters: columnFilters as Readonly<Ref<ColumnFiltersState>>,
    globalFilter: globalFilter as Readonly<Ref<string>>,
    columnVisibility: columnVisibility as Readonly<Ref<VisibilityState>>,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setColumnVisibility,
    refreshData,
    FlexRender,
  }
}
