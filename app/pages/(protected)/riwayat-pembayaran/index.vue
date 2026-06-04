<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { TableData, TableSorting } from '~/composables/useTable'
import type { ListPaymentsParams, Payment } from '~/features/payments/domain'
import type { Page } from '~/lib/transport'
import { usePaymentsQueries } from '~/features/payments/usePaymentsQueries'

const isAdmin = useIsAdmin()
const isWarga = useIsWarga()
const route = useRoute()
const qc = useQueryClient()
const paymentsQuery = usePaymentsQueries()

// ─── Admin params (dari URL) ──────────────────────────────────────────────────
const adminParams = computed<ListPaymentsParams>(() => {
  const page     = Math.max(1, Number(route.query.page) || 1)
  const pageSize = Math.max(1, Number(route.query.size ?? route.query.pageSize) || 10)
  const q        = typeof route.query.q === 'string' ? route.query.q : ''
  const status   = typeof route.query.status === 'string' ? route.query.status : undefined
  return { page, pageSize, search: q, status }
})

const listQ = paymentsQuery.useListQuery(adminParams, {
  initialData: () => ({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 } as Page<Payment>),
})

const isLoadingPayments = computed(() => listQ.isPending.value || listQ.isFetching.value)
const errorMessage      = computed(() => listQ.isError.value ? (listQ.error.value as Error)?.message ?? 'Unknown error' : '')

// ─── Admin: tabel ─────────────────────────────────────────────────────────────
const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'invoice_number',
    header: 'Invoice Number',
    enableSorting: false,
    cell: ({ row }) =>
      h('div', {
        class: 'cursor-pointer text-blue-600 hover:underline',
        onClick: () => navigateTo(`/riwayat-pembayaran/${row.original.bill?.id}`),
      }, row.original.bill?.invoiceNumber || '-'),
  },
  {
    accessorKey: 'amount',
    header: 'Nominal',
    enableSorting: false,
    cell: ({ row }) => {
      const amount = row.original.amount
      return h('div', {}, amount
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
        : '-')
    },
  },
  {
    accessorKey: 'paymentDate',
    header: 'Tanggal Bayar',
    enableSorting: false,
    cell: ({ row }) => {
      const date = row.original.paymentDate
      return h('div', {}, date
        ? new Intl.DateTimeFormat('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(date))
        : '-')
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.bill?.status
      const statusMap: Record<string, { label: string, class: string }> = {
        paid:    { label: 'Lunas',       class: 'bg-green-100 text-green-800' },
        unpaid:  { label: 'Belum Lunas', class: 'bg-red-100 text-red-800' },
        pending: { label: 'Pending',     class: 'bg-yellow-100 text-yellow-800' },
      }
      const config = statusMap[status ?? ''] ?? { label: status ?? '-', class: 'bg-gray-100 text-gray-800' }
      return h('div', {
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`,
      }, config.label)
    },
  },
]

async function handleServerSideChange(params: {
  page: number
  pageSize: number
  sorting: TableSorting[]
}): Promise<TableData<Payment>> {
  const nextParams: ListPaymentsParams = { page: params.page, pageSize: params.pageSize }
  try {
    await paymentsQuery.prefetchList(qc, nextParams)
    const cached = qc.getQueryData<Page<Payment>>(paymentsQuery.keys.list(nextParams))
    return { data: cached?.items ?? [], page: params.page, pageSize: params.pageSize, total: cached?.total ?? 0, totalPages: cached?.totalPages ?? 0 }
  }
  catch {
    return { data: [], page: params.page, pageSize: params.pageSize, total: 0, totalPages: 0 }
  }
}

// ─── Warga: kartu ─────────────────────────────────────────────────────────────
const wargaPage     = ref(1)
const wargaPageSize = 5
const wargaPayments  = ref<Payment[]>([])
const wargaTotalPages = ref(1)
const wargaLoading   = ref(false)

async function fetchWargaPayments() {
  wargaLoading.value = true
  try {
    const params: ListPaymentsParams = { page: wargaPage.value, pageSize: wargaPageSize }
    await paymentsQuery.prefetchList(qc, params)
    const cached = qc.getQueryData<Page<Payment>>(paymentsQuery.keys.list(params))
    wargaPayments.value  = cached?.items ?? []
    wargaTotalPages.value = cached?.totalPages ?? 1
  }
  catch (e) {
    console.error('Failed to fetch warga payments:', e)
  }
  finally {
    wargaLoading.value = false
  }
}

onMounted(() => {
  if (!isAdmin.value) fetchWargaPayments()
})

watch(wargaPage, () => {
  fetchWargaPayments()
})

const statusMap: Record<string, { label: string, class: string, icon: string }> = {
  paid:    { label: 'Lunas',       class: 'bg-green-100 text-green-700 border-green-200',    icon: '✓' },
  pending: { label: 'Pending',     class: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '○' },
  unpaid:  { label: 'Belum Lunas', class: 'bg-red-100 text-red-700 border-red-200',          icon: '!' },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(new Date(date))
}

useHead({ title: 'SIPLING - Riwayat Pembayaran' })
</script>

<template>
  <div class="mx-auto py-6 container">
    <div class="mb-6">
      <h1 v-if="!isAdmin" class="text-3xl tracking-tight">
        Riwayat Pembayaran
      </h1>
      <p v-if="!isAdmin" class="text-sm text-gray-500 mt-1">
        Riwayat transaksi pembayaran iuran Anda
      </p>
    </div>

    <!-- Error -->
    <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="ml-3">
        <h3 class="text-sm text-red-800 font-medium dark:text-red-200">Error loading riwayat pembayaran</h3>
        <div class="text-sm text-red-700 mt-2 dark:text-red-300">{{ errorMessage }}</div>
      </div>
    </div>

    <!-- ─── ADMIN: DataTable ──────────────────────────────────────────────── -->
    <template v-if="isAdmin">
      <CnCard class="flex flex-1 flex-col min-h-0">
        <div class="p-6 overflow-x-auto overflow-y-visible">
          <CnDataTable
            :key="`payments-table-${listQ.data.value?.total}`"
            :columns="columns"
            title="Riwayat Pembayaran"
            :data="listQ.data.value.items || []"
            :loading="isLoadingPayments"
            :on-server-side-change="handleServerSideChange"
            :page-size-options="[5, 10, 25, 50, 100]"
            :show-column-visibility="false"
            empty-message="Tidak ada riwayat pembayaran ditemukan."
            search-placeholder="Cari transaksi"
            server-side
            :width-offset="400"
            :url-sync="false"
          />
        </div>
      </CnCard>
    </template>

    <!-- ─── WARGA: Cards ─────────────────────────────────────────────────── -->
    <template v-else>
      <div class="max-w-2xl">
        <!-- Loading -->
        <div v-if="wargaLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white animate-pulse">
            <div class="flex justify-between items-start">
              <div class="space-y-2">
                <div class="h-3 w-32 bg-gray-200 rounded" />
                <div class="h-4 w-48 bg-gray-200 rounded" />
              </div>
              <div class="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div class="mt-3 pt-3 border-t flex justify-between">
              <div class="h-3 w-24 bg-gray-200 rounded" />
              <div class="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="wargaPayments.length === 0" class="text-center py-16 text-gray-400">
          <div class="text-4xl mb-3">🧾</div>
          <p class="text-sm">Belum ada riwayat pembayaran</p>
        </div>

        <!-- Cards -->
        <div v-else class="space-y-3">
          <div
            v-for="payment in wargaPayments"
            :key="payment.id"
            class="border rounded-xl bg-white shadow-sm overflow-hidden"
          >
            <div class="flex items-start justify-between p-4">
              <div>
                <p class="text-xs text-gray-400 mb-0.5">Invoice</p>
                <p
                  class="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                  @click="navigateTo(`/riwayat-pembayaran/${payment.bill?.id}`)"
                >
                  {{ payment.bill?.invoiceNumber || '-' }}
                </p>
              </div>
              <span
                v-if="payment.bill?.status"
                :class="statusMap[payment.bill.status]?.class ?? 'bg-gray-100 text-gray-600 border-gray-200'"
                class="text-xs font-medium px-2.5 py-0.5 rounded-full border"
              >
                {{ statusMap[payment.bill.status]?.icon }} {{ statusMap[payment.bill.status]?.label ?? payment.bill.status }}
              </span>
            </div>
            <div class="border-t mx-4" />
            <div class="flex items-center justify-between px-4 py-3">
              <p class="text-xs text-gray-400">
                {{ payment.paymentDate ? formatDate(payment.paymentDate) : '-' }}
              </p>
              <p class="text-base font-bold text-gray-900">
                {{ payment.amount ? formatCurrency(payment.amount) : '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="wargaTotalPages > 1" class="flex justify-center gap-2 mt-6">
          <button
            :disabled="wargaPage === 1"
            class="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
            @click="wargaPage--"
          >
            ← Sebelumnya
          </button>
          <span class="px-3 py-1.5 text-sm text-gray-500">{{ wargaPage }} / {{ wargaTotalPages }}</span>
          <button
            :disabled="wargaPage >= wargaTotalPages"
            class="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
            @click="wargaPage++"
          >
            Berikutnya →
          </button>
        </div>
      </div>
    </template>
  </div>
</template>