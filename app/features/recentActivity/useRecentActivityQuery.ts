import type { RecentActivity } from './domain'
import { useQuery } from '@tanstack/vue-query'
import type { Page } from '~/lib/transport'

export function useRecentActivityQuery() {
  const { $repos } = useNuxtApp()
  const repo = $repos.recentActivity

  const page = ref(1)
  const pageSize = ref(10)

  const queryParams = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
  }))

  const queryKey = computed(() => [
    'recent-activity',
    'list',
    JSON.stringify(queryParams.value),
  ])

  const {
    data: recentActivityData,
    isLoading: isLoadingRecentActivity,
    error: recentActivityError,
    refetch: refreshRecentActivityData,
  } = useQuery({
    queryKey: ['recent-activity', 'list', queryParams],  // langsung pass computed, bukan wrapped lagi
    queryFn: () => repo.list(queryParams.value),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  })

  const recentActivities = computed(() => recentActivityData.value?.items ?? [])
  const total = computed(() => recentActivityData.value?.total ?? 0)
  const totalPages = computed(() => recentActivityData.value?.totalPages ?? 0)

  return {
    // Data
    recentActivities,
    total,
    totalPages,
    recentActivityData,

    // Pagination
    page,
    pageSize,

    // States
    isLoadingRecentActivity,
    recentActivityError,
    refreshRecentActivityData,
  }
}