// composables/useDashboardQuery.ts
import type { Dashboard } from './domain'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

export function useDashboardQuery() {
  const { $repos } = useNuxtApp()

  if (!$repos || !$repos.dashboard) {
    throw new Error('Repository not available. Make sure $repos.dashboard is properly initialized.')
  }

  const repo = $repos.dashboard

  // Dashboard statistic query
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refreshDashboard,
  } = useQuery({
    queryKey: ['dashboard', 'statistic'],
    queryFn: () => repo.getDashboardStatistic(),
    staleTime: 2 * 60 * 1000,   // 2 menit
    gcTime: 10 * 60 * 1000,     // 10 menit
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  })

  const {
    data: dashboardRecentData,
    isLoading: isLoadingRecentData,
    error: dashboardRecentError,
    refetch: refreshDashboardRecentData,
  } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => repo.getRecentActivity(),
    staleTime: 2 * 60 * 1000,   // 2 menit
    gcTime: 10 * 60 * 1000,     // 10 menit
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  })


  // Computed values dari query result
  const totalWarga = computed(() => dashboardData.value?.totalWarga ?? 0)
  const unpaidBill = computed(() => dashboardData.value?.unpaidBill ?? 0)
  const monthlyIncome = computed(() => dashboardData.value?.monthlyIncome ?? 0)

  return {
    // Data
    dashboardData,
    totalWarga,
    unpaidBill,
    monthlyIncome,

    dashboardRecentData,
    isLoadingRecentData,
    dashboardRecentError,
    refreshDashboardRecentData,

    // Loading & error states
    isLoadingDashboard,
    dashboardError,

    // Actions
    refreshDashboard,
  }
}