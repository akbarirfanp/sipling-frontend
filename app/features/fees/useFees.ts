import type { Fee, CreateFeeCmd, UpdateFeeCmd } from './domain'

export function useFee() {
  const { $repos } = useNuxtApp()
  const repo = $repos.fees
  const route = useRoute()
  const router = useRouter()

  const fees = ref<Fee[]>([])
  const isLoadingFee = ref(false)
  const accountsError = ref<string | null>(null)
  const total = ref(0)
  const totalPages = ref(0)

  // Initialize from URL query params
  const page = ref(Number(route.query.page) || 1)
  const pageSize = ref(Number(route.query.pageSize) || 10)
  const q = ref((route.query.q as string) || '')
  const sortBy = ref((route.query.sortBy as string) || '')
  const sortOrder = ref((route.query.sortOrder as string) || '')
  const search = ref((route.query.search as string) || '')
  const status = ref((route.query.status as string) || '')

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

  const refreshFee = async () => {
    isLoadingFee.value = true
    accountsError.value = null
    try {
      const res = await repo.list({
        page: page.value,
        pageSize: pageSize.value,
        q: q.value,
        sortBy: sortBy.value || undefined,
        sortOrder: sortOrder.value || undefined,
        search: search.value || undefined,
        status: status.value || undefined,
      })
      fees.value = res.items
      total.value = res.total
      totalPages.value = res.totalPages
    }
    catch (e) {
      accountsError.value = getErrorMessage(e, 'Gagal memuat data iuran')
      fees.value = []
      total.value = 0
      totalPages.value = 0
    }
    finally {
      isLoadingFee.value = false
    }
  }

  // Watch for changes and update URL
  watch([page, pageSize, q, sortBy, sortOrder, search, status], () => {
    updateUrlQuery()
  }, { deep: true })

  const getFee = (id: string) => repo.get(id)
  const createFee = async (cmd: CreateFeeCmd) => {
    const u = await repo.create(cmd)
    await refreshFee()
    return u
  }
  const updateFee = async (id: string, cmd: UpdateFeeCmd) => {
    const u = await repo.update(id, cmd)
    await refreshFee()
    return u
  }
  const deleteFee = async (id: string) => {
    await repo.delete(id)
    await refreshFee()
  }

  return {
    fees,
    isLoadingFee,
    accountsError,
    total,
    totalPages,
    page,
    pageSize,
    q,
    sortBy,
    sortOrder,
    search,
    status,
    refreshFee,
    getFee,
    createFee,
    updateFee,
    deleteFee,
  }
}
