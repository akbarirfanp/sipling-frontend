<script setup lang="ts">
import { useDashboardQuery } from '~/features/dashboard/useDashboardQuery'
import RecentActivity from '~/components/RecentActivity.vue'

const {
  totalWarga,
  unpaidBill,
  monthlyIncome,
  isLoadingDashboard,
  dashboardError,
} = useDashboardQuery()

const isAdmin = useIsAdmin()

const currentMonthRange = computed(() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const fmt = (d: Date) =>
    d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return `${fmt(start)} – ${fmt(end)}`
})

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)

const formatNumber = (val: number) =>
  new Intl.NumberFormat('id-ID').format(val)

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
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-semibold text-gray-900">Overview</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Here's how your business is performing today.
      </p>
    </div>

    <!-- Error State -->
    <div v-if="dashboardError" class="text-sm text-red-500">
      Gagal memuat data: {{ dashboardError.message }}
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Monthly Income -->
      <CnCard>
        <CnCardContent class="p-5">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <p class="text-sm text-gray-500 font-medium">Pemasukan Bulan Ini</p>
              <p
                class="text-2xl font-bold text-blue-600 transition-all duration-500"
                :class="{ 'opacity-40 animate-pulse': isLoadingDashboard }"
              >
                {{ isLoadingDashboard ? 'Rp —' : formatCurrency(monthlyIncome) }}
              </p>
              <p class="text-xs text-gray-400 flex items-center gap-1 font-medium">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ currentMonthRange }}
              </p>
            </div>
            <div class="p-2.5 bg-blue-50 rounded-lg">
              <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
              </svg>
            </div>
          </div>
        </CnCardContent>
      </CnCard>

      <!-- Total Warga -->
      <CnCard>
        <CnCardContent class="p-5">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <p class="text-sm text-gray-500 font-medium">Jumlah Warga</p>
              <p
                class="text-2xl font-bold text-gray-900 transition-all duration-500"
                :class="{ 'opacity-40 animate-pulse': isLoadingDashboard }"
              >
                {{ isLoadingDashboard ? '—' : formatNumber(totalWarga) }}
              </p>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-lg">
              <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
        </CnCardContent>
      </CnCard>

      <!-- Unpaid Bills -->
      <CnCard v-if="isAdmin">
        <CnCardContent class="p-5">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <p class="text-sm text-gray-500 font-medium">Tagihan Belum Lunas</p>
              <p
                class="text-2xl font-bold text-red-500 transition-all duration-500"
                :class="{ 'opacity-40 animate-pulse': isLoadingDashboard }"
              >
                {{ isLoadingDashboard ? '—' : formatNumber(unpaidBill) }}
              </p>
              <p class="text-xs text-red-400 flex items-center gap-1 font-medium">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {{ unpaidBill > 0 ? 'Belum Lunas' : 'Tidak ada tagihan' }}
              </p>
            </div>
            <div class="p-2.5 bg-red-50 rounded-lg">
              <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
          </div>
        </CnCardContent>
      </CnCard>
    </div>

    <RecentActivity
      v-if="isAdmin"
    />
  </div>
</template>