import type { ChangePasswordCmd, CreateUserCmd, ListUsersParams, UpdateUserCmd, User } from './domain'
import { getErrorMessage } from '~~/shared/types/error'

export function useUsers() {
  const { $repos } = useNuxtApp()
  const repo = $repos.users
  const route = useRoute()
  const router = useRouter()

  const users = ref<User[]>([])
  const isLoadingUsers = ref(false)
  const usersError = ref<string | null>(null)
  const total = ref(0)
  const totalPages = ref(0)

  // Query parameters - initialize from URL with proper SSR handling
  const page = ref(1)
  const pageSize = ref(10)
  const search = ref('')
  const sortBy = ref('')
  const sortOrder = ref('')
  const status = ref('')
  const memberQueue = ref('')
  const memberDivision = ref('')
  const isAdmin = ref('')

  // Initialize from route query after hydration to avoid SSR mismatch
  onMounted(() => {
    page.value = Number(route.query.page) || 1
    pageSize.value = Number(route.query.pageSize) || 10
    search.value = (route.query.search as string) || ''
    sortBy.value = (route.query.sortBy as string) || ''
    sortOrder.value = (route.query.sortOrder as string) || ''
    status.value = (route.query.status as string) || ''
    memberQueue.value = (route.query.memberQueue as string) || ''
    memberDivision.value = (route.query.memberDivision as string) || ''
    isAdmin.value = (route.query.isAdmin as string) || ''
  })

  // Update URL query params
  const updateUrlQuery = () => {
    const query: Record<string, string> = {}
    if (page.value > 1)
      query.page = page.value.toString()
    if (pageSize.value !== 10)
      query.pageSize = pageSize.value.toString()
    if (search.value)
      query.search = search.value
    if (sortBy.value)
      query.sortBy = sortBy.value
    if (sortOrder.value)
      query.sortOrder = sortOrder.value
    if (status.value)
      query.status = status.value
    if (memberQueue.value)
      query.memberQueue = memberQueue.value
    if (memberDivision.value)
      query.memberDivision = memberDivision.value
    if (isAdmin.value)
      query.isAdmin = isAdmin.value

    router.push({ query })
  }

  // Watch for route changes and sync state from URL
  watch(() => route.query, (newQuery) => {
    const newPage = Number(newQuery.page) || 1
    const newPageSize = Number(newQuery.pageSize) || 10
    const newSearch = (newQuery.search as string) || ''
    const newSortBy = (newQuery.sortBy as string) || ''
    const newSortOrder = (newQuery.sortOrder as string) || ''
    const newStatus = (newQuery.status as string) || ''
    const newMemberQueue = (newQuery.memberQueue as string) || ''
    const newMemberDivision = (newQuery.memberDivision as string) || ''
    const newIsAdmin = (newQuery.isAdmin as string) || ''

    // Update state without triggering watch loop
    if (page.value !== newPage)
      page.value = newPage
    if (pageSize.value !== newPageSize)
      pageSize.value = newPageSize
    if (search.value !== newSearch)
      search.value = newSearch
    if (sortBy.value !== newSortBy)
      sortBy.value = newSortBy
    if (sortOrder.value !== newSortOrder)
      sortOrder.value = newSortOrder
    if (status.value !== newStatus)
      status.value = newStatus
    if (memberQueue.value !== newMemberQueue)
      memberQueue.value = newMemberQueue
    if (memberDivision.value !== newMemberDivision)
      memberDivision.value = newMemberDivision
    if (isAdmin.value !== newIsAdmin)
      isAdmin.value = newIsAdmin
  }, { immediate: true })

  const refreshUsers = async () => {
    isLoadingUsers.value = true
    usersError.value = null

    try {
      const params: ListUsersParams = {
        page: page.value,
        pageSize: pageSize.value,
      }

      // Add optional parameters only if they have values
      if (search.value)
        params.search = search.value
      if (sortBy.value)
        params.sortBy = sortBy.value
      if (sortOrder.value)
        params.sortOrder = sortOrder.value
      if (status.value)
        params.status = status.value
      if (memberQueue.value)
        params.memberQueue = memberQueue.value
      if (memberDivision.value)
        params.memberDivision = memberDivision.value
      if (isAdmin.value)
        params.isAdmin = isAdmin.value

      const res = await repo.list(params)
      users.value = res.items
      total.value = res.total
      totalPages.value = res.totalPages
    }
    catch (e: unknown) {
      usersError.value = getErrorMessage(e, 'Failed to load users')
      users.value = []
      total.value = 0
      totalPages.value = 0
    }
    finally {
      isLoadingUsers.value = false
    }
  }

  // Watch for parameter changes and update URL + refresh data
  watch([page, pageSize, sortBy, sortOrder, search, status], () => {
    updateUrlQuery()
    refreshUsers()
  }, { deep: true })

  // Search helper functions
  const performSearch = (searchTerm: string) => {
    search.value = searchTerm
    page.value = 1 // Reset to first page when searching
  }

  const clearSearch = () => {
    search.value = ''
    page.value = 1
  }

  const setFilter = (filterKey: string, filterValue: string) => {
    switch (filterKey) {
      case 'status':
        status.value = filterValue
        break
      case 'search':
        search.value = filterValue
        break
      case 'memberQueue':
        memberQueue.value = filterValue
        break
      case 'memberDivision':
        memberDivision.value = filterValue
        break
      case 'isAdmin':
        isAdmin.value = filterValue
        break
      default:
        break
    }
    page.value = 1 // Reset to first page when filtering
  }

  const clearFilters = () => {
    search.value = ''
    status.value = ''
    memberQueue.value = ''
    memberDivision.value = ''
    isAdmin.value = ''
    sortBy.value = ''
    sortOrder.value = ''
    page.value = 1
  }

  // Pagination helpers
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
      page.value = pageNumber
    }
  }

  const nextPage = () => {
    if (page.value < totalPages.value) {
      page.value++
    }
  }

  const prevPage = () => {
    if (page.value > 1) {
      page.value--
    }
  }

  // CRUD operations
  const getUser = (id: string) => repo.get(id)

  const createUser = async (cmd: CreateUserCmd) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const user = await repo.create(cmd)
      await refreshUsers()
      return user
    }
    catch (error) {
      throw error
    }
  }

  const updateUser = async (id: string, cmd: UpdateUserCmd) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const user = await repo.update(id, cmd)
      await refreshUsers()
      return user
    }
    catch (error) {
      throw error
    }
  }

  const changePassword = async (id: string, cmd: ChangePasswordCmd) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const user = await repo.changePassword(id, cmd)
      await refreshUsers()
      return user
    }
    catch (error) {
      throw error
    }
  }

  const deleteUser = async (id: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await repo.delete(id)
      await refreshUsers()
    }
    catch (error) {
      throw error
    }
  }

  // Initialize data on mount
  onMounted(() => {
    refreshUsers()
  })

  return {
    // Data
    users,
    isLoadingUsers,
    usersError,
    total,
    totalPages,

    // Query parameters
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    status,
    memberQueue,
    memberDivision,
    isAdmin,

    // Actions
    refreshUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changePassword,

    // Search & Filter helpers
    performSearch,
    clearSearch,
    setFilter,
    clearFilters,

    // Pagination helpers
    goToPage,
    nextPage,
    prevPage,

    // Computed helpers
    hasNextPage: computed(() => page.value < totalPages.value),
    hasPrevPage: computed(() => page.value > 1),
    isFiltered: computed(() =>
      !!search.value || !!status.value || !!sortBy.value || !!memberQueue.value || !!memberDivision.value || !!isAdmin.value,
    ),
  }
}
