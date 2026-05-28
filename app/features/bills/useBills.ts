import type { Bill, GenerateBillCmd } from './domain'

export function useBill() {
  const { $repos } = useNuxtApp()
  const repo = $repos.bills
  const route = useRoute()
  const router = useRouter()

  const bills = ref<Bill[]>([])
  const isLoadingBill = ref(false)
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

  const refreshBill = async () => {
    isLoadingBill.value = true
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
      bills.value = res.items
      total.value = res.total
      totalPages.value = res.totalPages
    }
    catch (e) {
      accountsError.value = getErrorMessage(e, 'Gagal memuat data iuran')
      bills.value = []
      total.value = 0
      totalPages.value = 0
    }
    finally {
      isLoadingBill.value = false
    }
  }

  // Watch for changes and update URL
  watch([page, pageSize, q, sortBy, sortOrder, search, status], () => {
    updateUrlQuery()
  }, { deep: true })

  const getBill = (id: string) => repo.get(id)
  const generateBill = async (cmd: GenerateBillCmd) => {
    const u = await repo.generate(cmd)
    await refreshBill()
    return u
  }

  return {
    bills,
    isLoadingBill,
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
    refreshBill,
    getBill,
    generateBill,
  }
}
