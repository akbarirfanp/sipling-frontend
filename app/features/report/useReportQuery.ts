import { useQuery } from '@tanstack/vue-query'

export function useReportQuery() {
  const { $repos } = useNuxtApp()
  const repo = $repos.report

  const startDate = ref('')
  const endDate = ref('')

  const isReady = computed(() => !!startDate.value && !!endDate.value)

  const {
    data: reportData,
    isLoading: isLoadingReport,
    error: reportError,
    refetch: refreshReportData,
  } = useQuery({
    queryKey: ['generate-report', 'list', startDate, endDate],
    queryFn: () => {
      const params = {
        start_date: startDate.value,
        end_date: endDate.value,
        pageSize: 200,
      }
      return repo.list(params)
    },
    enabled: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const report = computed(() => reportData.value?.items ?? [])
  const total = computed(() => reportData.value?.total ?? 0)
  const totalPages = computed(() => reportData.value?.totalPages ?? 0)

  return {
    startDate,
    endDate,
    isReady,
    report,
    total,
    totalPages,
    reportData,
    isLoadingReport,
    reportError,
    refreshReportData,
  }
}