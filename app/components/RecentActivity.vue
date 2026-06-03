<script setup lang="ts">
import { useRecentActivityQuery } from '~/features/recentActivity/useRecentActivityQuery'

const {
  recentActivities,
  total,
  totalPages,
  page,
  isLoadingRecentActivity,
} = useRecentActivityQuery()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)

const formatRelativeTime = (date: string) => {
  const now = new Date()
  const target = new Date(date)

  const diffMs = now.getTime() - target.getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`

  return `${diffDays}d ago`
}
</script>

<template>
  <CnCard>
    <CnCardContent class="p-0">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p class="text-sm text-gray-500">Aktivitas pembayaran terbaru warga</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingRecentActivity" class="divide-y">
        <div
          v-for="i in 5"
          :key="i"
          class="flex items-center justify-between px-5 py-4 animate-pulse"
        >
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-full bg-gray-200" />
            <div class="space-y-2">
              <div class="w-56 h-4 rounded bg-gray-200" />
              <div class="w-28 h-3 rounded bg-gray-100" />
            </div>
          </div>
          <div class="w-16 h-4 rounded bg-gray-200" />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!recentActivities?.length"
        class="py-10 text-center text-sm text-gray-400"
      >
        Belum ada aktivitas terbaru
      </div>

      <!-- Activity -->
      <div v-else class="divide-y">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">
                <span class="font-semibold">{{ activity.userName }}</span>
                telah melakukan pembayaran
                <span class="text-black">{{ activity.feeName }}</span>
              </p>
              <div class="flex items-center gap-2 mt-1">
                <p
                  class="text-xs text-blue-500 cursor-pointer hover:underline"
                  @click="navigateTo(`/riwayat-pembayaran/${activity.billId}`)"
                >
                  Cek Tagihan
                </p>
                <span class="text-gray-300">•</span>
                <p class="text-xs text-gray-400">{{ formatRelativeTime(activity.paymentDate) }}</p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-emerald-600">
              +{{ formatCurrency(activity.grossAmount) }}
            </p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3 border-t">
          <p class="text-sm text-gray-500">Total {{ total }} aktivitas</p>
          <div class="flex gap-2">
            <CnButton variant="outline" size="sm" :disabled="page <= 1" @click="page--">
              Previous
            </CnButton>
            <CnButton variant="outline" size="sm" :disabled="page >= totalPages" @click="page++">
              Next
            </CnButton>
          </div>
        </div>
      </div>
    </CnCardContent>
  </CnCard>
</template>