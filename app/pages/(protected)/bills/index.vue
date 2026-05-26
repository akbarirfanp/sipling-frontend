<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { TableData, TableFilters, TableSorting } from '~/composables/useTable'
import type { ListBillsParams, Bill } from '~/features/bills/domain'
import type { Page } from '~/lib/transport'
import { useBillsQueries } from '~/features/bills/useBillsQueries'
import { useGlobalDialog } from '~/composables/useDialog'
import GenerateBillDialog from '~/features/bills/components/GenerateBillDialog.vue'

const isAdmin = useIsAdmin()

// Define columns for the table
const columns: ColumnDef<Bill>[] = [
  {
    accessorKey: 'invoice_number',
    header: 'Invoice Number',
    enableSorting: false,
    cell: ({ row }) =>
      h('div', {
        class: 'cursor-pointer text-blue-600 hover:underline',
        onClick: () => {
          navigateTo(`/bills/${row.original.id}`)
        },
      }, row.original.invoiceNumber || '-'),
  },
  {
    accessorKey: 'user',
    header: 'Nama Warga',
    enableSorting: false,
    cell: ({ row }) => h('div', {}, row.original.user?.name || '-'),
  },
  {
    accessorKey: 'gross_amount',
    header: 'Nominal',
    enableSorting: false,
    cell: ({ row }) => {
        const amount = row.original.grossAmount
        return h('div', {}, amount
          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
          : '-')
      },
  },
  {
    accessorKey: 'due_date',
    header: 'Jatuh Tempo',
    enableSorting: false,
    cell: ({ row }) => {
        const date = row.original.dueDate
        return h('div', {}, date
          ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
          : '-')
      },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.status

      const statusMap: Record<string, { label: string, class: string }> = {
        unpaid:  { label: 'Belum Lunas',  class: 'bg-red-100 text-red-800' },
        pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
        paid: { label: 'Lunas', class: 'bg-green-100 text-green-800' },
      }

      const config = statusMap[status] ?? { label: status, class: 'bg-gray-100 text-gray-800' }

      return h('div', {
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`,
      }, config.label)
    },
  },
]

const route = useRoute()
const qc = useQueryClient()
const billsQuery = useBillsQueries()

const listParams = computed<ListBillsParams>(() => {
  const page = Math.max(1, Number(route.query.page) || 1)
  const pageSize = Math.max(1, Number((route.query).size ?? (route.query).pageSize) || 10)

  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const sort = typeof route.query.sort === 'string' ? route.query.sort : undefined
  const order = route.query.order === 'desc'
    ? 'desc' as const
    : route.query.order === 'asc'
      ? 'asc' as const
      : undefined
  const status = typeof route.query.status === 'string' ? route.query.status : undefined

  return { page, pageSize, search: q, sort, order, status }
})

// query ke BE (otomatis re-fetch kalau route.query berubah, krn listParams computed)
const listQ = billsQuery.useListQuery(listParams, {
  initialData: () => ({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 } as Page<Bill>),
})

const isLoadingUsers = computed(() => listQ.isPending.value || listQ.isFetching.value)
const errorMessage = computed(() => listQ.isError.value ? (listQ.error.value as Error)?.message ?? 'Unknown error' : '')

// Fetch function for the table using useUsers composable
// Handle server-side changes - sesuai dengan interface yang diharapkan useTable
async function handleServerSideChange(params: {
  page: number
  pageSize: number
  sorting: TableSorting[]
  filters: TableFilters
}): Promise<TableData<Bill>> {
  const status = (params.filters?.status as string | undefined) || undefined
  const search
    = (params.filters?.q as string | undefined)
      ?? (params.filters?.search as string | undefined)
      ?? ''

  const nextParams: ListBillsParams = {
    page: params.page,
    pageSize: params.pageSize,
    search,
    status,
  }

  // ❇️ Force fetch fresh data instead of relying on cache
  try {
    await billsQuery.prefetchList(qc, nextParams)

    // ambil hasilnya dari cache (samain key)
    const cached = qc.getQueryData<Page<Bill>>(billsQuery.keys.list(nextParams))

    // // Kalau cache kosong setelah prefetch, langsung fetch
    // if (!cached) {
    //   const { $repos } = useNuxtApp()
    //   cached = await $repos.users.list(nextParams)
    //   // Set ke cache biar konsisten
    //   qc.setQueryData(usersQuery.keys.list(nextParams), cached)
    // }

    return {
      data: cached?.items ?? [],
      page: params.page,
      pageSize: params.pageSize,
      total: cached?.total ?? 0,
      totalPages: cached?.totalPages ?? 0,
    }
  }
  catch (error) {
    console.error('Failed to fetch users:', error)
    return {
      data: [],
      page: params.page,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    }
  }
}

// Show pop up dialog
const dialog = useGlobalDialog()
function handleGenerateBill() {
  dialog.open(
    GenerateBillDialog,
    {},
    {
      title: 'Generate Iuran',
      size: 'md',
      closable: true,
      description: 'Untuk generate iuran, isi informasi dibawah ini.',
    },
  )
}

// Set page title
useHead({
  title: 'SIPLING - Tagihan Iuran',
})
</script>

<template>
  <div class="mx-auto py-6 container">
    <!-- Page Header -->

    <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm text-red-800 font-medium dark:text-red-200">
            Error loading tagihan
          </h3>
          <div class="text-sm text-red-700 mt-2 dark:text-red-300">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <CnCard class="flex flex-1 flex-col min-h-0">
      <div class="p-6 overflow-x-auto overflow-y-visible">
        <CnDataTable
          :key="`bills-table-${listQ.data.value?.total}`"
          :columns="columns"
          title="Tagihan Iuran"
          :data="listQ.data.value.items || []"
          :loading="isLoadingUsers"
          :on-server-side-change="handleServerSideChange"
          :page-size-options="[5, 10, 25, 50, 100]"
          :show-column-visibility="false"
          empty-message="Tidak ada tagihan"
          search-placeholder="Cari invoice"
          server-side
          :width-offset="400"
          :url-sync="false"
        >
        <template #actions>
          <CnButton
                v-if="isAdmin"
                variant="outline"
                class="text-primary border-primary h-10 hover:text-primary hover:bg-primary/10"
                @click="handleGenerateBill"
              >
                <Icon name="ph:plus" class="h-4 w-4" />
                Generate Tagihan
              </CnButton>
          </template>
        </CnDataTable>
      </div>
    </CnCard>
  </div>
</template>
