<script setup lang="ts">
import { useBillsQuery } from '~/features/bills/useBillsQuery'
import PaymentButton from '~/features/payments/components/PaymentButton.vue'

interface Props {
  billId: string
}
const isWarga = useIsWarga()

const props = defineProps<Props>()

const { useBillQuery } = useBillsQuery()
const billQuery = useBillQuery(props.billId)
</script>

<template>
  <div class="border rounded-lg bg-white shadow-sm">
    <!-- Loading State -->
    <div v-if="billQuery.isLoading.value" class="p-6 animate-pulse">
      <div class="gap-4 grid grid-cols-2">
        <div v-for="i in 8" :key="`skeleton-${i}`" class="space-y-1">
          <CnSkeleton class="h-3 w-24" />
          <CnSkeleton class="h-4 w-full" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="billQuery.isError.value" class="p-6 text-center">
      <p class="text-sm text-red-600 mb-3">
        Gagal memuat detail tagihan
      </p>
      <button
        class="text-sm text-white px-4 py-2 rounded bg-blue-500 hover:bg-blue-600"
        @click="billQuery.refetch()"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="billQuery.data.value" class="p-6">
      <h2 class="text-sm text-gray-900 font-semibold mb-4 px-3 py-2 rounded bg-gray-50">
        ID Tagihan: {{ billQuery.data.value.invoiceNumber || '-' }}
      </h2>

      <div class="gap-x-6 gap-y-4 grid grid-cols-2">
        <div>
          <p class="text-xs text-gray-500 mb-1">Nama</p>
          <p class="text-sm text-gray-900">{{ billQuery.data.value.user?.name || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Tanggal Jatuh Tempo</p>
          <span :class="billQuery.data.value.dueDate && new Date(billQuery.data.value.dueDate) < new Date()
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
          " class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
            {{ billQuery.data.value.dueDate
              ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(billQuery.data.value.dueDate))
              : '-' }}
          </span>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Nominal</p>
          <p class="text-sm text-gray-900">
            {{ billQuery.data.value.grossAmount
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(billQuery.data.value.grossAmount)
              : '-' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Status</p>
          <p>
            <span :class="{
              'bg-red-100 text-red-800': billQuery.data.value.status === 'unpaid',
              'bg-yellow-100 text-yellow-800': billQuery.data.value.status === 'pending',
              'bg-green-100 text-green-800': billQuery.data.value.status === 'paid',
            }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
              {{ { unpaid: 'Belum Lunas', pending: 'Pending', paid: 'Lunas' }[billQuery.data.value.status] || '-' }}
            </span>
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Jenis Iuran</p>
          <p class="text-sm text-gray-900">{{ billQuery.data.value.fee?.name || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Deskripsi</p>
          <p class="text-sm text-gray-900">{{ billQuery.data.value.fee?.description || '-' }}</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t my-6" />

      <!-- Payment Button -->
      <PaymentButton
        :bill-id="billId"
        :status="billQuery.data.value.status"
        v-if="isWarga"
      />
    </div>
  </div>
</template>