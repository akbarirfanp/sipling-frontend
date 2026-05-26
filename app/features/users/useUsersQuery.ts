import type { ChangePasswordCmd, CreateUserCmd, UpdateUserCmd, User } from './domain'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

/**
 * Vue Query composable untuk users feature
 * Mengintegrasikan Vue Query dengan $repos pattern yang udah ada
 */
export function useUsersQuery(scope?: string) {
  const { $repos } = useNuxtApp()
  const repo = $repos.users
  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Helper function untuk get scoped parameter key
  const getScopedKey = (key: string) => {
    return scope ? `${scope}_${key}` : key
  }

  // Helper function untuk get value dari route query dengan scope
  const getScopedQueryValue = (key: string): string => {
    const scopedKey = getScopedKey(key)
    return (route.query[scopedKey] as string) || ''
  }

  // Helper function untuk get number value dari route query dengan scope
  const getScopedQueryNumber = (key: string, defaultValue: number): number => {
    const scopedKey = getScopedKey(key)
    return Number(route.query[scopedKey]) || defaultValue
  }

  // Query params dari URL - handle SSR/hydration dengan proper initialization
  const page = ref(1)
  const pageSize = ref(10)
  const search = ref('')
  const sortBy = ref('')
  const sortOrder = ref('')
  const status = ref('')
  const memberQueue = ref('')
  const memberDivision = ref('')
  const isAdmin = ref('')

  // Initialize dari route query setelah hydration dengan scope
  onMounted(() => {
    page.value = getScopedQueryNumber('page', 1)
    pageSize.value = getScopedQueryNumber('pageSize', 10)
    search.value = getScopedQueryValue('search')
    sortBy.value = getScopedQueryValue('sortBy')
    sortOrder.value = getScopedQueryValue('sortOrder')
    status.value = getScopedQueryValue('status')
    memberQueue.value = getScopedQueryValue('memberQueue')
    memberDivision.value = getScopedQueryValue('memberDivision')
    isAdmin.value = getScopedQueryValue('isAdmin')
  })

  // Computed query params untuk Vue Query key
  const queryParams = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value || undefined,
    status: status.value || undefined,
    memberQueue: memberQueue.value || undefined,
    memberDivision: memberDivision.value || undefined,
    isAdmin: isAdmin.value || undefined,
  }))

  // Stable query key untuk Vue Query - include scope untuk isolation
  const queryKey = computed(() => [
    'users',
    'list',
    scope || 'default',
    JSON.stringify(queryParams.value),
  ])

  // Update URL query params dengan scope
  const updateUrlQuery = () => {
    const currentQuery = { ...route.query }

    // Set scoped query params
    if (page.value > 1) {
      currentQuery[getScopedKey('page')] = page.value.toString()
    }
    else {
      delete currentQuery[getScopedKey('page')]
    }

    if (pageSize.value !== 10) {
      currentQuery[getScopedKey('pageSize')] = pageSize.value.toString()
    }
    else {
      delete currentQuery[getScopedKey('pageSize')]
    }

    if (search.value) {
      currentQuery[getScopedKey('search')] = search.value
    }
    else {
      delete currentQuery[getScopedKey('search')]
    }

    if (sortBy.value) {
      currentQuery[getScopedKey('sortBy')] = sortBy.value
    }
    else {
      delete currentQuery[getScopedKey('sortBy')]
    }

    if (sortOrder.value) {
      currentQuery[getScopedKey('sortOrder')] = sortOrder.value
    }
    else {
      delete currentQuery[getScopedKey('sortOrder')]
    }

    if (status.value) {
      currentQuery[getScopedKey('status')] = status.value
    }
    else {
      delete currentQuery[getScopedKey('status')]
    }

    if (memberQueue.value) {
      currentQuery[getScopedKey('memberQueue')] = memberQueue.value
    }
    else {
      delete currentQuery[getScopedKey('memberQueue')]
    }

    if (memberDivision.value) {
      currentQuery[getScopedKey('memberDivision')] = memberDivision.value
    }
    else {
      delete currentQuery[getScopedKey('memberDivision')]
    }

    if (isAdmin.value) {
      currentQuery[getScopedKey('isAdmin')] = isAdmin.value
    }
    else {
      delete currentQuery[getScopedKey('isAdmin')]
    }

    router.push({ query: currentQuery })
  }

  // Watch for route changes dan sync state dari URL dengan scope
  watch(() => route.query, () => {
    const newPage = getScopedQueryNumber('page', 1)
    const newPageSize = getScopedQueryNumber('pageSize', 10)
    const newSearch = getScopedQueryValue('search')
    const newSortBy = getScopedQueryValue('sortBy')
    const newSortOrder = getScopedQueryValue('sortOrder')
    const newStatus = getScopedQueryValue('status')
    const newMemberQueue = getScopedQueryValue('memberQueue')
    const newMemberDivision = getScopedQueryValue('memberDivision')
    const newIsAdmin = getScopedQueryValue('isAdmin')

    // Update state tanpa trigger watch loop
    if (page.value !== newPage)
      page.value = newPage
    if (pageSize.value !== newPageSize)
      pageSize.value = newPageSize
    if (sortBy.value !== newSortBy)
      sortBy.value = newSortBy
    if (sortOrder.value !== newSortOrder)
      sortOrder.value = newSortOrder
    if (search.value !== newSearch)
      search.value = newSearch
    if (status.value !== newStatus)
      status.value = newStatus
    if (memberQueue.value !== newMemberQueue)
      memberQueue.value = newMemberQueue
    if (memberDivision.value !== newMemberDivision)
      memberDivision.value = newMemberDivision
    if (isAdmin.value !== newIsAdmin)
      isAdmin.value = newIsAdmin
  }, { immediate: true })

  // Watch for state changes and update URL
  watch([page, pageSize, search, sortBy, sortOrder, status, memberQueue, memberDivision, isAdmin], () => {
    updateUrlQuery()
  }, { deep: true })

  // Users list query dengan Vue Query
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refreshUsers,
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
  const users = computed(() => usersData.value?.items || [])
  const total = computed(() => usersData.value?.total || 0)
  const totalPages = computed(() => usersData.value?.totalPages || 0)

  // Single user query dengan scope
  const useUserQuery = (id: MaybeRefOrGetter<string>) => {
    return useQuery({
      queryKey: ['users', 'detail', scope || 'default', id],
      queryFn: () => repo.get(toValue(id)),
      enabled: () => !!toValue(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  // Create user mutation dengan scope
  const createUserMutation = useMutation({
    mutationFn: (cmd: CreateUserCmd) => repo.create(cmd),
    onSuccess: () => {
      // Invalidate users list untuk refresh data
      queryClient.invalidateQueries({
        queryKey: ['users', 'list', scope || 'default'],
      })
    },
  })

  // Update user mutation dengan scope
  const updateUserMutation = useMutation({
    mutationFn: (variables: { id: string, cmd: UpdateUserCmd }) => repo.update(variables.id, variables.cmd),
    onSuccess: (updatedUser: User, { id }: { id: string, cmd: UpdateUserCmd }) => {
      // Update cache untuk single user
      queryClient.setQueryData(['users', 'detail', scope || 'default', id], updatedUser)
      // Invalidate users list
      queryClient.invalidateQueries({
        queryKey: ['users', 'list', scope || 'default'],
      })
    },
  })

  // Delete user mutation dengan scope
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: (_: void, id: string) => {
      // Remove dari cache
      queryClient.removeQueries({
        queryKey: ['users', 'detail', scope || 'default', id],
      })
      // Invalidate users list
      queryClient.invalidateQueries({
        queryKey: ['users', 'list', scope || 'default'],
      })
    },
  })
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ id, cmd }: { id: string, cmd: ChangePasswordCmd }) =>
      repo.changePassword(id, cmd),
    onSuccess: (_: void, { id }) => {
      // invalidate user detail biar data fresh
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', id] })
    },
  })

  // Helper functions dengan Vue Query dan scope
  const getUser = (id: string) => {
    return queryClient.getQueryData(['users', 'detail', scope || 'default', id]) as User | undefined
  }

  const createUser = async (cmd: CreateUserCmd) => {
    return createUserMutation.mutateAsync(cmd)
  }

  const updateUser = async (id: string, cmd: UpdateUserCmd) => {
    return updateUserMutation.mutateAsync({ id, cmd })
  }

  const deleteUser = async (id: string) => {
    return deleteUserMutation.mutateAsync(id)
  }

  const changePassword = async (id: string, cmd: ChangePasswordCmd) => {
    return changePasswordMutation.mutateAsync({ id, cmd })
  }

  // Prefetch user untuk optimistic loading
  const prefetchUser = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['users', 'detail', scope || 'default', id],
      queryFn: () => repo.get(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    // Data
    users,
    total,
    totalPages,
    usersData,

    // Loading states
    isLoadingUsers,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,

    // Error states
    usersError,
    createUserError: createUserMutation.error,
    updateUserError: updateUserMutation.error,
    deleteUserError: deleteUserMutation.error,

    // Query params
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
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getUser,
    prefetchUser,

    // Single user query helper
    useUserQuery,

    // Mutations untuk advanced usage
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    changePasswordMutation,
  }
}

/**
 * Backward compatibility wrapper
 * Bisa dipake sebagai drop-in replacement untuk useUsers yang lama
 */
export function useUsers() {
  const query = useUsersQuery()

  return {
    users: query.users,
    isLoadingUsers: query.isLoadingUsers,
    usersError: computed(() => query.usersError.value?.message || null),
    total: query.total,
    totalPages: query.totalPages,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    status: query.status,
    memberQueue: query.memberQueue,
    memberDivision: query.memberDivision,
    isAdmin: query.isAdmin,
    refreshUsers: query.refreshUsers,
    getUser: query.getUser,
    createUser: query.createUser,
    updateUser: query.updateUser,
    deleteUser: query.deleteUser,
  }
}
