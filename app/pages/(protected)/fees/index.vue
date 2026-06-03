<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { TableData, TableFilters, TableSorting } from '~/composables/useTable'
import type { Fee, ListFeesParams } from '~/features/fees/domain'
import { useFeesQueries } from '~/features/fees/useFeesQueries'
import type { Page } from '~/lib/transport'

const columns: ColumnDef<Fee>[] = [
  {
    accessorKey: 'name',
    header: () => h('div', { class: 'whitespace-nowrap' }, 'Nama Iuran'),
    enableSorting: true,
    cell: ({ row }) =>
      h('div', {
        class: 'cursor-pointer text-blue-600 hover:underline',
        onClick: () => {
          navigateTo(`/fees/${row.original.id}`)
        },
      }, row.original.name || '-'),
  },
  {
    accessorKey: 'amount',
    header: () => h('div', { class: 'whitespace-nowrap' }, 'Nominal'),
    enableSorting: false,
    cell: ({ row }) => h('div', {}, row.original.amount ? `Rp ${row.original.amount.toLocaleString('id-ID')}` : '-'),
  },
  {
    accessorKey: 'period',
    header: 'Periode',
    enableSorting: false,
    cell: ({ row }) => h('div', {}, row.original.period || '-'),
  },
  {
    accessorKey: 'Deskripsi',
    header: () => h('div', { class: 'whitespace-nowrap' }, 'Deskripsi'),
    enableSorting: false,
    cell: ({ row }) => h('div', {}, row.original.description || '-'),
  },
]

// ---------------------------------------------
// Server-side params (sinkron sama route.query)
// page = 1-based
// ---------------------------------------------
const route = useRoute()
const qc = useQueryClient()
const feesQuery = useFeesQueries()

const listParams = computed<ListFeesParams>(() => {
  const page = Math.max(1, Number(route.query.page) || 1)
  const pageSize = Math.max(1, Number(route.query.size ?? route.query.pageSize) || 10)

  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const sortBy = typeof route.query.sort_by === 'string' ? route.query.sort_by : undefined
  const sortOrder = route.query.sort_order === 'desc'
    ? 'desc' as const
    : route.query.order === 'asc'
      ? 'asc' as const
      : undefined
  const status = typeof route.query.status === 'string' ? route.query.status : undefined

  return { page, pageSize, search: q, sortBy, sortOrder, status }
})

// query ke BE (otomatis re-fetch kalau route.query berubah, krn listParams computed)
const listQ = feesQuery.useListQuery(listParams, {
  initialData: () => ({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 } as Page<Fee>),
})

const isLoadingAccounts = computed(() => listQ.isPending.value || listQ.isFetching.value)
const errorMessage = computed(() => listQ.isError.value ? (listQ.error.value as Error)?.message ?? 'Unknown error' : '')

// ---------------------------------------------
// Server-side change handler dari CnDataTable
// Argumen tipe kira-kira seperti ini — adjust kalau beda:
// { pageIndex, pageSize, sort?: {id, desc}|null, search?: string, filters?: { status?: string } }
// ---------------------------------------------
async function handleServerSideChange(params: {
  page: number
  pageSize: number
  sorting: TableSorting[]
  filters: TableFilters
}): Promise<TableData<Fee>> {
  const primary = params.sorting?.[0]
  const sortBy = primary?.field
  const sortOrder: 'asc' | 'desc' | undefined
    = primary ? (('desc' in primary ? primary.desc : primary?.direction === 'desc') ? 'desc' : 'asc') : undefined

  const status = (params.filters?.status as string | undefined) || undefined
  const search
    = (params.filters?.q as string | undefined)
      ?? (params.filters?.search as string | undefined)
      ?? ''

  const nextParams: ListFeesParams = {
    page: params.page,
    pageSize: params.pageSize,
    search,
    sortBy,
    sortOrder,
    status,
  }

  try {
    await feesQuery.prefetchList(qc, nextParams)
    const cached = qc.getQueryData<Page<Fee>>(feesQuery.keys.list(nextParams))
    return {
      data: cached?.items ?? [],
      page: params.page,
      pageSize: params.pageSize,
      total: cached?.total ?? 0,
      totalPages: cached?.totalPages ?? 0,
    }
  }
  catch (error) {
    console.error('Failed to fetch fees:', error)
    return {
      data: [],
      page: params.page,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    }
  }
}

function handleCreateFee() {
  navigateTo('/fees/create-fee')
}

useHead({ title: 'Manajemen Iuran' })
</script>

<template>
  <div class="mx-auto py-6 container">

    <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm text-red-800 font-medium dark:text-red-200">
            Error loading fees
          </h3>
          <div class="text-sm text-red-700 mt-2 dark:text-red-300">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>
    <CnCard
      class="flex flex-1 flex-col min-h-0"
    >
      <!-- Add custom styling for table to prevent line breaks -->
      <div class="p-6 overflow-x-auto overflow-y-visible">
        <CnDataTable
          :key="`accounts-table-${listQ.data.value?.total}`"
          title="Data Iuran"
          :columns="columns"
          :data="listQ.data.value.items || []"
          :loading="isLoadingAccounts"
          :on-server-side-change="handleServerSideChange"
          :page-size-options="[5, 10, 25, 50, 100, 250]"
          :show-column-visibility="false"
          empty-message="Tidak ada data iuran yang ditemukan"
          search-placeholder="Cari jenis iuran"
          server-side
          :width-offset="400"
          :url-sync="false"
        >
          <template #actions>
            <CnButton
              variant="outline"
              class="text-primary border-primary h-10 hover:text-primary hover:bg-primary/10"
              @click="handleCreateFee"
            >
              <Icon name="ph:plus" class="h-4 w-4" />
              Buat Iuran
            </CnButton>
          </template>
        </CnDataTable>
      </div>
    </CnCard>
  </div>
</template>
