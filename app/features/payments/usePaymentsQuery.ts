import { useFeesQuery } from '../fees/useFeesQuery'
import type { Payment } from './domain'
import { useQueryClient } from '@tanstack/vue-query'

export function usePaymentsQuery() {
  const { $repos } = useNuxtApp()
  if (!$repos || !$repos.payments) {
    throw new Error('Repository not available. Make sure $repos.payments is properly initialized.')
  }
  const repo = $repos.payments
  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Query params dari URL - handle SSR/hydration dengan proper initialization
  const page = ref(1)
  const pageSize = ref(10)
  const q = ref('')
  const sortBy = ref('')
  const sortOrder = ref('')
  const search = ref('')
  const status = ref('')

  // Initialize dari route query setelah hydration
  onMounted(() => {
    page.value = Number(route.query.page) || 1
    pageSize.value = Number(route.query.pageSize) || 10
    q.value = (route.query.q as string) || ''
    sortBy.value = (route.query.sortBy as string) || ''
    sortOrder.value = (route.query.sortOrder as string) || ''
    search.value = (route.query.search as string) || ''
    status.value = (route.query.status as string) || ''
  })

  // Computed query params untuk Vue Query key
  const queryParams = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    q: q.value,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value || undefined,
    search: search.value || undefined,
    status: status.value || undefined,
  }))

  // Stable query key untuk Vue Query
  const queryKey = computed(() => [
    'payments',
    'list',
    JSON.stringify(queryParams.value),
  ])

  // Update URL query params
  const updateUrlQuery = () => {
    const query: Record<string, string> = {}
    if (page.value > 1)
      query.page = page.value.toString()
    if (pageSize.value !== 10)
      query.pageSize = pageSize.value.toString()
    if (q.value)
      query.q = q.value
    if (sortBy.value)
      query.sortBy = sortBy.value
    if (sortOrder.value)
      query.sortOrder = sortOrder.value
    if (search.value)
      query.search = search.value
    if (status.value)
      query.status = status.value

    router.push({ query })
  }

  // Watch for route changes dan sync state dari URL
  watch(() => route.query, (newQuery) => {
    // Sync state dari URL query changes (untuk navigation)
    const newPage = Number(newQuery.page) || 1
    const newPageSize = Number(newQuery.pageSize) || 10
    const newQ = (newQuery.q as string) || ''
    const newSortBy = (newQuery.sortBy as string) || ''
    const newSortOrder = (newQuery.sortOrder as string) || ''
    const newSearch = (newQuery.search as string) || ''
    const newStatus = (newQuery.status as string) || ''

    // Update state tanpa trigger watch loop
    if (page.value !== newPage)
      page.value = newPage
    if (pageSize.value !== newPageSize)
      pageSize.value = newPageSize
    if (q.value !== newQ)
      q.value = newQ
    if (sortBy.value !== newSortBy)
      sortBy.value = newSortBy
    if (sortOrder.value !== newSortOrder)
      sortOrder.value = newSortOrder
    if (search.value !== newSearch)
      search.value = newSearch
    if (status.value !== newStatus)
      status.value = newStatus
  }, { immediate: true })

  // Watch for state changes and update URL
  watch([page, pageSize, q, sortBy, sortOrder, search, status], () => {
    updateUrlQuery()
  }, { deep: true })

  // Accounts list query dengan Vue Query
  const {
    data: paymentData,
    isLoading: isLoadingPayment,
    error: paymentsError,
    refetch: refreshPayment,
  } = useQuery({
    queryKey,
    queryFn: () => repo.list(queryParams.value),
    staleTime: 2 * 60 * 1000, // 2 minutes - lebih pendek untuk ensure fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes - cache disimpan 10 menit
    refetchOnWindowFocus: false, // Jangan refetch saat window focus
    refetchOnReconnect: false, // Jangan refetch saat reconnect
    refetchOnMount: true, // Always refetch on mount untuk ensure fresh data
    enabled: true, // Always enabled
  })

  // Computed values dari query result
  const payments = computed(() => paymentData.value?.items || [])
  const total = computed(() => paymentData.value?.total || 0)
  const totalPages = computed(() => paymentData.value?.totalPages || 0)

  // Single fee query
  const usePaymentQuery = (id: MaybeRefOrGetter<string>) => {
    return useQuery({
      queryKey: ['payments', 'snap-token', id],
      queryFn: () => repo.getSnapToken(toValue(id)),
      enabled: () => !!toValue(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  // // Create fee mutation
  // const createPaymentMutation = useMutation({
  //   mutationFn: (cmd: CreatePaymentCmd) => repo.create(cmd),
  //   onSuccess: () => {
  //     // Invalidate fee list untuk refresh data
  //     queryClient.invalidateQueries({ queryKey: ['fees', 'list'] })
  //   },
  // })

  // Update fee mutation
  // const updateFeeMutation = useMutation({
  //   mutationFn: (variables: { id: string } & UpdateFeeCmd) => repo.update(variables.id, variables),
  //   onSuccess: (updatedFee: Fee, { id }: { id: string }) => {
  //     // Update cache untuk single fee
  //     queryClient.setQueryData(['fees', 'detail', id], updatedFee)
  //     // Invalidate fee list
  //     queryClient.invalidateQueries({ queryKey: ['fees', 'list'] })
  //   },
  // })

  // Helper functions dengan Vue Query
  const getSnapToken = (id: string) => {
    return queryClient.getQueryData(['payments', 'snap-token', id]) as Payment | undefined
  }

  // const createFee = async (cmd: CreateFeeCmd) => {
  //   return createFeeMutation.mutateAsync(cmd)
  // }


  // Prefetch fee untuk optimistic loading
  const prefetchFee = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['payments', 'snap-token', id],
      queryFn: () => repo.getSnapToken(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    // Data
    payments,
    total,
    totalPages,
    paymentData,

    // Loading states
    isLoadingPayment,

    // Error states
    paymentsError,

    // Query params
    page,
    pageSize,
    q,
    sortBy,
    sortOrder,
    search,
    status,

    // Actions
    refreshPayment,
    getSnapToken,
    prefetchFee,

    // Single account query helper
    usePaymentQuery,
  }
}

/**
 * Backward compatibility wrapper
 * Bisa dipake sebagai drop-in replacement untuk useAccounts yang lama
 */
export function usePayments() {
  const query = usePaymentsQuery()

  return {
    payments: query.payments,
    isLoadingFee: query.isLoadingPayment,
    feeError: computed(() => query.paymentsError.value?.message || null),
    total: query.total,
    totalPages: query.totalPages,
    page: query.page,
    pageSize: query.pageSize,
    q: query.q,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    search: query.search,
    status: query.status,
    refreshPayment: query.refreshPayment,
    getSnapToken: query.getSnapToken,
  }
}
