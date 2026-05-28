<script setup lang="ts" generic="T">
import type { ColumnDef } from '@tanstack/vue-table'

export interface FilterOptions {
  key: string
  label: string
  type?: 'select' | 'scx-select' | 'custom'
  options?: Array<{ value: string, label: string }>
  fetcher?: (query: string, cursor?: string) => Promise<ScxSelectFetchResult>
  props?: Record<string, any>
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data?: T[]
  serverSide?: boolean
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  showColumnVisibility?: boolean
  showPagination?: boolean
  initialPageSize?: number
  pageSizeOptions?: number[]
  showPageOptions?: boolean
  showFilterOptions?: boolean
  emptyMessage?: string
  urlSync?: boolean
  tableId?: string
  title?: string
  titlePosition?: 'inside' | 'outside'
  onServerSideChange?: UseTableOptions<T>['onServerSideChange']
  filterOptions?: FilterOptions[]
  widthOffset?: number // Tambahan: berapa pixel dikurangin dari screen width
}

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  data: () => [],
  serverSide: false,
  loading: false,
  searchable: true,
  searchPlaceholder: 'Search...',
  showColumnVisibility: true,
  showPagination: true,
  initialPageSize: 10,
  pageSizeOptions: () => [10, 20, 30, 40, 50],
  showPageOptions: true,
  showFilterOptions: true,
  emptyMessage: 'No data available.',
  titlePosition: 'outside',
  urlSync: true,
  tableId: undefined,
  filterOptions: () => [],
  widthOffset: 100, // Default: screen width - 100px
})

const {
  table,
  data: tableData,
  isLoading,
  error,
  pagination,
  totalItems,
  canPreviousPage,
  canNextPage,
  columnFilters,
  globalFilter,
  columnVisibility,
  setPageSize,
  setPageIndex,
  setColumnFilters,
  setGlobalFilter,
  setColumnVisibility,
  FlexRender,
} = useTableWithUrl<T>({
  columns: props.columns,
  data: props.data,
  serverSide: props.serverSide,
  initialPageSize: props.initialPageSize,
  onServerSideChange: props.onServerSideChange,
  urlSync: props.urlSync,
  tableId: props.tableId,
  queryParamNames: {
    page: 'page',
    pageSize: 'pageSize',
    sortBy: 'sortBy',
    sortOrder: 'sortOrder',
    search: 'search',
  },
})

// Dynamic width based on screen size
const containerWidth = ref(0)

function updateWidth() {
  containerWidth.value = window.innerWidth - props.widthOffset
}

// Initialize width
onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})

// Computed style for dynamic max-width
const containerStyle = computed(() => ({
  maxWidth: `${containerWidth.value}px`,
  width: '100%',
}))

// Local search value untuk immediate UI feedback
const searchValue = ref('')

// Local filter state
const localFilters = ref<Record<string, string>>({})

// Column visibility dropdown state
const showColumnVisibilityDropdown = ref(false)

// Filter dialog state
const showFilterDialog = ref(false)

// Debounced search function
const debouncedSearch = useDebounceFn((value: string) => {
  setGlobalFilter(value)
}, 300)

// Initialize local filters
watchEffect(() => {
  if (props.filterOptions) {
    const initialFilters: Record<string, string> = {}
    props.filterOptions.forEach((filter) => {
      const existingFilter = columnFilters.value.find(cf => cf.id === filter.key)
      initialFilters[filter.key] = existingFilter?.value as string || ''
    })
    localFilters.value = initialFilters
  }
})

// Watch search value changes
watch(searchValue, (newValue) => {
  debouncedSearch(newValue)
})

// Sync local search with global filter (untuk server-side search)
watch(globalFilter, (newValue) => {
  if (newValue !== searchValue.value) {
    searchValue.value = newValue || ''
  }
})

// Computed values
const isLoadingState = computed(() => props.loading || isLoading.value)
const hasData = computed(() => tableData.value.length > 0)
const visibleColumns = computed(() =>
  table.getAllColumns().filter(column => column.getCanHide()),
)

const hasActiveFilters = computed(() => {
  return searchValue.value || columnFilters.value.length > 0
})

const hasColumnFilters = computed(() => {
  return columnFilters.value.length > 0
})

const paginationInfo = computed(() => {
  if (totalItems.value === 0)
    return 'No entries'
  const start = pagination.value.pageIndex * pagination.value.pageSize + 1
  const end = Math.min((pagination.value.pageIndex + 1) * pagination.value.pageSize, totalItems.value)
  return `Showing ${start} to ${end} from ${totalItems.value} entries`
})

const pageSizeSelectOptions = computed(() =>
  props.pageSizeOptions.map(size => ({
    value: String(size),
    label: String(size),
  })),
)

const _filterSelectOptions = computed(() => {
  const options: Record<string, Array<{ value: string, label: string }>> = {}
  props.filterOptions.forEach((filter) => {
    options[filter.key] = [
      { value: '', label: `- Select ${filter.label} -` },
      ...(filter.options || []),
    ]
  })
  return options
})

// Functions
function handlePageSizeChange(value: any | string[]) {
  const size = Array.isArray(value != null) ? value[0] : value
  if (size) {
    const numValue = typeof value === 'string' ? Number.parseInt(size) : Number(value)
    if (!Number.isNaN(numValue)) {
      setPageSize(numValue)
    }
  }
}

function handleSearchChange(value: string) {
  searchValue.value = value
  if (pagination.value.pageIndex > 0) {
    setPageIndex(0)
  }
}

function clearSearch() {
  searchValue.value = ''
  setGlobalFilter('')
  if (pagination.value.pageIndex > 0) {
    setPageIndex(0)
  }
}

function toggleColumnVisibility(columnId: string, visible: boolean) {
  setColumnVisibility({
    ...columnVisibility.value,
    [columnId]: visible,
  })
}

function clearFilters() {
  searchValue.value = ''
  setGlobalFilter('')
  setColumnFilters([])
  const resetFilters: Record<string, string> = {}
  props.filterOptions.forEach((filter) => {
    resetFilters[filter.key] = ''
  })
  localFilters.value = resetFilters
  showFilterDialog.value = false

  if (pagination.value.pageIndex > 0) {
    setPageIndex(0)
  }

  if (props.urlSync) {
    nextTick(() => {
      const router = useRouter()
      router.replace({ query: {} })
    })
  }
}

function handlePageChange(page: number) {
  setPageIndex(page - 1)
}

function applyFilters() {
  const activeFilters = Object.entries(localFilters.value)
    .filter(([_, v]) => v)
    .map(([key, value]) => ({ id: key, value }))
  setColumnFilters(activeFilters)
  showFilterDialog.value = false
  if (pagination.value.pageIndex > 0) {
    setPageIndex(0)
  }
}

function handleFilterChange(filterKey: string, value: string | string[]) {
  const filterValue = Array.isArray(value) ? value[0] : value
  localFilters.value[filterKey] = filterValue || ''
}

watch(() => props.data, (newData) => {
  if (!props.serverSide && newData) {
    nextTick(() => {
      // Update table data jika diperlukan
    })
  }
}, { deep: true })

function _isValidSearchString(search: string): boolean {
  return typeof search === 'string' && search.trim().length > 0
}
</script>

<template>
  <div :style="containerStyle" class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <!-- Global Search -->
        <div v-if="searchable" class="max-w-sm relative">
          <div class="grid h-full w-4 left-2 place-content-center absolute">
            <Icon name="ph:magnifying-glass" class="text-muted-foreground h-4 w-4" />
          </div>
          <CnInput
            v-model="searchValue"
            :placeholder="searchPlaceholder"
            class="pl-8 h-11 w-80"
            @input="(e: Event) => handleSearchChange((e.target as HTMLInputElement).value)"
          />
          <div class="grid h-full right-1 top-0 place-content-center absolute">
            <CnButton
              v-if="searchValue"
              variant="ghost"
              size="sm"
              class="p-0 h-6 w-6"
              @click="clearSearch"
            >
              <Icon name="ph:x" class="h-3 w-3" />
            </CnButton>
          </div>
        </div>

        <!-- Filter Dialog -->
        <CnDialog v-if="filterOptions.length > 0 && showFilterOptions" v-model:open="showFilterDialog">
          <CnDialogTrigger as-child>
            <CnButton variant="outline" size="icon" class="size-11 relative" :class="hasColumnFilters ? 'text-red-600' : ''">
              <Icon name="ph:funnel-simple" class="h-4 w-4" />
              <span
                v-if="hasColumnFilters"
                class="rounded-full bg-red-500 h-2.5 w-2.5 absolute -right-1 -top-1"
              />
            </CnButton>
          </CnDialogTrigger>
          <CnDialogContent class="sm:max-w-[425px]">
            <CnDialogHeader>
              <CnDialogTitle>Filter</CnDialogTitle>
            </CnDialogHeader>
            <div class="py-4 gap-4 grid">
              <div
                v-for="filter in filterOptions"
                :key="filter.key"
                class="gap-2 grid"
              >
                <label class="text-sm font-medium">{{ filter.label }}</label>
                <template v-if="filter.type === 'scx-select'">
                  <ScxSelect
                    :model-value="localFilters[filter.key]"
                    :fetcher="filter.fetcher"
                    v-bind="filter.props"
                    @update:model-value="(value: string | string[]) => handleFilterChange(filter.key, value)"
                  />
                </template>
                <template v-else>
                  <select
                    :value="localFilters[filter.key]"
                    class="text-sm px-3 py-1 border border-input rounded-md bg-background h-9 focus:outline-none focus:ring-2 focus:ring-ring"
                    @change="(e) => handleFilterChange(filter.key, (e.target as HTMLSelectElement).value)"
                  >
                    <option value="">
                      - Select {{ filter.label }} -
                    </option>
                    <option
                      v-for="option in filter.options"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </template>
              </div>
            </div>
            <CnDialogFooter>
              <CnButton
                type="button"
                variant="outline"
                class="text-red-500 border-red-500 h-11 w-full hover:text-red-500 hover:bg-red-500/10"
                @click="clearFilters"
              >
                Reset
              </CnButton>
              <CnButton
                type="button"
                class="bg-primary h-11 w-full"
                @click="applyFilters"
              >
                Apply
              </CnButton>
            </CnDialogFooter>
          </CnDialogContent>
        </CnDialog>

        <!-- Clear Filters Button -->
        <CnButton
          v-if="hasActiveFilters && showFilterOptions"
          class="ml-2"
          variant="outline"
          size="lg"
          @click="clearFilters"
        >
          Reset
        </CnButton>
      </div>

      <!-- Custom toolbar actions slot -->
      <div class="ml-2 flex items-center space-x-2">
        <slot name="actions" />
        <slot name="toolbar-actions" />
      </div>

      <!-- Column Visibility -->
      <CnDropdownMenu v-if="showColumnVisibility" v-model:open="showColumnVisibilityDropdown">
        <CnDropdownMenuTrigger as-child>
          <CnButton variant="outline" size="sm">
            <Icon name="ph:funnel" class="mr-2 h-4 w-4" />
            Columns
            <Icon name="ph:caret-down" class="ml-2 h-4 w-4" />
          </CnButton>
        </CnDropdownMenuTrigger>
        <CnDropdownMenuContent align="end" class="w-48">
          <CnDropdownMenuLabel>Toggle columns</CnDropdownMenuLabel>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuCheckboxItem
            v-for="column in visibleColumns"
            :key="column.id"
            :checked="column.getIsVisible()"
            @update:checked="(value: boolean) => toggleColumnVisibility(column.id, value)"
          >
            {{ column.columnDef.header || column.id }}
          </CnDropdownMenuCheckboxItem>
        </CnDropdownMenuContent>
      </CnDropdownMenu>
    </div>
    <h2 v-if="title && titlePosition === 'outside'" class="text-xl font-medium my-6">
      {{ title }}
    </h2>
    <!-- Table -->
    <div class="border rounded-md min-h-6.25rem overflow-auto" style="max-height: calc(100vh - 28.5rem);">
      <h2 v-if="title && titlePosition === 'inside'" class="text-xl font-medium p-6 pb-4">
        {{ title }}
      </h2>
      <CnTable>
        <CnTableHeader class="bg-background top-0 sticky">
          <CnTableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <CnTableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="bg-background whitespace-nowrap"
              :class="{ 'cursor-pointer select-none': header.column.getCanSort() }"
              @click="header.column.getCanSort() ? header.column.toggleSorting() : undefined"
            >
              <div class="flex gap-2 items-center">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <div v-if="header.column.getCanSort()" class="flex flex-col">
                  <Icon
                    name="ph:caret-up"
                    class="h-3 w-3 transition-colors"
                    :class="[
                      header.column.getIsSorted() === 'asc'
                        ? 'text-foreground'
                        : 'text-muted-foreground/50',
                    ]"
                  />
                  <Icon
                    name="ph:caret-down"
                    class="h-3 w-3 transition-colors -mt-1"
                    :class="[
                      header.column.getIsSorted() === 'desc'
                        ? 'text-foreground'
                        : 'text-muted-foreground/50',
                    ]"
                  />
                </div>
              </div>
            </CnTableHead>
          </CnTableRow>
        </CnTableHeader>
        <CnTableBody>
          <!-- Loading -->
          <CnTableRow v-if="isLoadingState">
            <CnTableCell :colspan="table.getAllColumns().length" class="text-center h-24">
              <div class="flex items-center justify-center space-x-2">
                <div class="border-2 border-primary border-t-transparent rounded-full h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </CnTableCell>
          </CnTableRow>

          <!-- Error -->
          <CnTableRow v-else-if="error">
            <CnTableCell :colspan="table.getAllColumns().length" class="text-destructive text-center h-24">
              {{ error }}
            </CnTableCell>
          </CnTableRow>

          <!-- Empty -->
          <CnTableRow v-else-if="!hasData">
            <CnTableCell :colspan="table.getAllColumns().length" class="text-center h-24">
              {{ emptyMessage }}
            </CnTableCell>
          </CnTableRow>

          <!-- Data -->
          <template v-else>
            <CnTableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="whitespace-nowrap"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <CnTableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </CnTableCell>
            </CnTableRow>
          </template>
        </CnTableBody>
      </CnTable>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination" class="px-2 flex items-center justify-between">
      <!-- Kiri: Dropdown Show Rows -->
      <div v-if="showPageOptions" class="flex gap-2 items-center">
        <p class="text-sm font-medium">
          Show
        </p>
        <CnSelect
          :model-value="String(pagination.pageSize)"
          class="h-9 w-16"
          @update:model-value="handlePageSizeChange"
        >
          <CnSelectTrigger class="h-9 w-16">
            <CnSelectValue />
          </CnSelectTrigger>
          <CnSelectContent>
            <CnSelectItem
              v-for="option in pageSizeSelectOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </CnSelectItem>
          </CnSelectContent>
        </CnSelect>
        <p class="text-sm font-medium">
          rows
        </p>
      </div>

      <!-- Tengah: Pagination -->
      <div class="flex items-center">
        <CnPagination
          :total="totalItems"
          :items-per-page="pagination.pageSize"
          :sibling-count="1"
          :show-edges="true"
          :page="pagination.pageIndex + 1"
          @update:page="handlePageChange"
        >
          <CnPaginationContent v-slot="{ items }">
            <div class="flex gap-1 items-center">
              <CnPaginationPrevious
                :disabled="!canPreviousPage"
                class="text-sm text-foreground px-3 py-2 border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </CnPaginationPrevious>
              <template v-for="(page, index) in items" :key="index">
                <CnPaginationItem
                  v-if="page.type === 'page'"
                  :value="page.value"
                  :is-active="page.value === pagination.pageIndex + 1"
                  class="text-sm px-3 py-2 border border-neutral-200 rounded-md transition-colors"
                  :class="[
                    page.value === pagination.pageIndex + 1
                      ? 'bg-primary/60 text-primary-foreground border-primary/60 pointer-events-none'
                      : 'hover:bg-primary hover:text-primary-foreground cursor-pointer',
                  ]"
                  @click="page.value !== pagination.pageIndex + 1 ? handlePageChange(page.value) : undefined"
                >
                  {{ page.value }}
                </CnPaginationItem>
                <CnPaginationItem
                  v-else-if="page.type === 'ellipsis'"
                  :value="0"
                  class="text-sm text-neutral-400 px-3 py-2"
                >
                  <CnPaginationEllipsis />
                </CnPaginationItem>
              </template>

              <!-- Tombol Next -->
              <CnPaginationNext
                :disabled="!canNextPage"
                class="text-sm text-foreground px-3 py-2 border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </CnPaginationNext>
            </div>
          </CnPaginationContent>
        </CnPagination>
      </div>

      <div class="text-sm text-foreground ml-1">
        {{ paginationInfo }}
      </div>
    </div>
  </div>
</template>
