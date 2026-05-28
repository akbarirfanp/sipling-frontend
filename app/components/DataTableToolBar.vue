<script lang="ts" setup generic="TData">
import type { Table as TanstackTable } from '@tanstack/vue-table'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props<TData> {
  table: TanstackTable<TData>
  class?: HTMLAttributes['class']
  searchable?: boolean
  searchPlaceholder?: string
  showColumnVisibility?: boolean
}

const props = withDefaults(defineProps<Props<TData>>(), {
  class: undefined,
  searchable: true,
  searchPlaceholder: 'Search...',
  showColumnVisibility: true,
})

const emit = defineEmits<{
  searchChange: [value: string]
  resetFilters: []
}>()

const searchValue = ref<string>('')
const showColumnVisibilityDropdown = ref(false)

// Computed values
const visibleColumns = computed(() =>
  props.table.getAllColumns().filter(column => column.getCanHide()),
)

const hasActiveFilters = computed(() => {
  const columnFilters = props.table.getState().columnFilters
  const globalFilter = props.table.getState().globalFilter
  return searchValue.value || columnFilters.length > 0 || globalFilter
})

// Methods
function handleSearchChange(value: string | number) {
  searchValue.value = String(value)
  emit('searchChange', searchValue.value)
}

function clearSearch() {
  searchValue.value = ''
  emit('searchChange', '')
}

function clearAllFilters() {
  searchValue.value = ''
  props.table.resetColumnFilters()
  props.table.resetGlobalFilter()
  emit('resetFilters')
}

function toggleColumnVisibility(columnId: string, value: boolean) {
  props.table.getColumn(columnId)?.toggleVisibility(value)
}

function getColumnLabel(column: any) {
  return column.columnDef.header || column.id
}
</script>

<template>
  <div :class="cn('flex w-full items-center justify-between space-x-2', props.class)">
    <!-- Left side: Search, Filters -->
    <div class="flex flex-1 items-center space-x-2">
      <!-- Global Search -->
      <div v-if="searchable" class="relative">
        <Icon name="ph:magnifying-glass" class="text-muted-foreground h-4 w-4 left-2 top-2.5 absolute" />
        <CnInput
          :model-value="searchValue"
          type="search"
          :placeholder="searchPlaceholder"
          class="pl-8 w-64"
          @update:model-value="handleSearchChange"
        />
        <!-- Clear search button -->
        <CnButton
          v-if="searchValue"
          variant="ghost"
          size="sm"
          class="p-0 h-7 w-7 right-1 top-1 absolute"
          @click="clearSearch"
        >
          <Icon name="ph:x" class="h-3 w-3" />
        </CnButton>
      </div>

      <!-- Reset All -->
      <CnButton
        v-if="hasActiveFilters"
        variant="outline"
        size="sm"
        @click="clearAllFilters"
      >
        <Icon name="ph:x" class="mr-2 h-4 w-4" />
        Reset
      </CnButton>
    </div>

    <!-- Right side -->
    <div class="flex gap-2 items-center">
      <!-- Slot for custom actions -->
      <slot name="actions" />

      <!-- Column Visibility -->
      <CnDropdownMenu v-if="showColumnVisibility" v-model:open="showColumnVisibilityDropdown">
        <CnDropdownMenuTrigger as-child>
          <CnButton variant="outline" size="sm">
            <Icon name="ph:columns" class="mr-2 h-4 w-4" />
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
            {{ getColumnLabel(column) }}
          </CnDropdownMenuCheckboxItem>
        </CnDropdownMenuContent>
      </CnDropdownMenu>
    </div>
  </div>
</template>
