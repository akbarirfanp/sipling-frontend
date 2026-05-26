import type { CreateRoleCmd, Role, UpdateRoleCmd } from './domain'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

/**
 * Vue Query composable untuk roles feature
 * Mengintegrasikan Vue Query dengan $repos pattern yang udah ada
 */
export function useRolesQuery() {
  const { $repos } = useNuxtApp()
  const repo = $repos.roles
  const route = useRoute()
  const queryClient = useQueryClient()

  // Query params dari URL - handle SSR/hydration dengan proper initialization
  const page = ref(1)
  const pageSize = ref(10)
  const search = ref('')
  const sortBy = ref('')
  const sortOrder = ref('')
  const status = ref('')

  // Initialize dari route query setelah hydration
  onMounted(() => {
    page.value = Number(route.query.page) || 1
    pageSize.value = Number(route.query.pageSize) || 10
    search.value = (route.query.search as string) || ''
    sortBy.value = (route.query.sortBy as string) || ''
    sortOrder.value = (route.query.sortOrder as string) || ''
    status.value = (route.query.status as string) || ''
  })

  // Computed query params untuk Vue Query key
  const queryParams = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value || undefined,
    status: status.value || undefined,
  }))

  // Stable query key untuk Vue Query
  const queryKey = computed(() => [
    'roles',
    'list',
    JSON.stringify(queryParams.value),
  ])

  // Watch for route changes dan sync state dari URL
  watch(() => route.query, (newQuery) => {
    // Sync state dari URL query changes (untuk navigation)
    const newPage = Number(newQuery.page) || 1
    const newPageSize = Number(newQuery.pageSize) || 10
    const newSearch = (newQuery.search as string) || ''
    const newSortBy = (newQuery.sortBy as string) || ''
    const newSortOrder = (newQuery.sortOrder as string) || ''
    const newStatus = (newQuery.status as string) || ''

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
  }, { immediate: true })

  // Watch for state changes and update URL - REMOVED to prevent circular updates
  // URL updates will be handled by the page component when needed
  // watch([page, pageSize, search, sortBy, sortOrder, status], () => {
  //   updateUrlQuery()
  // }, { deep: true })

  // Roles list query dengan Vue Query
  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    error: rolesError,
    refetch: refreshRoles,
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
  const roles = computed(() => rolesData.value?.items || [])
  const total = computed(() => rolesData.value?.total || 0)
  const totalPages = computed(() => rolesData.value?.totalPages || 0)

  // Single role query
  const useRoleQuery = (id: MaybeRefOrGetter<string>) => {
    return useQuery({
      queryKey: ['roles', 'detail', id],
      queryFn: () => repo.get(toValue(id)),
      enabled: () => !!toValue(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (variables: { id: string, cmd: UpdateRoleCmd }) => repo.update(variables.id, variables.cmd),
    onSuccess: (updatedRole: Role, variables: { id: string, cmd: UpdateRoleCmd }) => {
      // Update cache untuk single role
      queryClient.setQueryData(['roles', 'detail', variables.id], updatedRole)
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
    },
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: (_: void, id: string) => {
      // Remove dari cache
      queryClient.removeQueries({ queryKey: ['roles', 'detail', id] })
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: ['roles', 'list'] })
    },
  })

  // Helper functions dengan Vue Query
  const getRole = (id: string) => {
    return queryClient.getQueryData(['roles', 'detail', id]) as Role | undefined
  }

  const updateRole = async (id: string, cmd: UpdateRoleCmd) => {
    return updateRoleMutation.mutateAsync({ id, cmd })
  }

  const deleteRole = async (id: string) => {
    return deleteRoleMutation.mutateAsync(id)
  }

  // Prefetch role untuk optimistic loading
  const prefetchRole = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['roles', 'detail', id],
      queryFn: () => repo.get(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    // Data
    roles,
    total,
    totalPages,
    rolesData,

    // Loading states
    isLoadingRoles,
    isUpdatingRole: updateRoleMutation.isPending,
    isDeletingRole: deleteRoleMutation.isPending,

    // Error states
    rolesError,
    updateRoleError: updateRoleMutation.error,
    deleteRoleError: deleteRoleMutation.error,

    // Query params
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    status,

    // Actions
    refreshRoles,
    updateRole,
    deleteRole,
    getRole,
    prefetchRole,

    // Single role query helper
    useRoleQuery,

    // Mutations untuk advanced usage
    updateRoleMutation,
    deleteRoleMutation,
  }
}

/**
 * Backward compatibility wrapper
 * Bisa dipake sebagai drop-in replacement untuk useRoles yang lama
 */
export function useRoles() {
  const query = useRolesQuery()

  return {
    roles: query.roles,
    isLoadingRoles: query.isLoadingRoles,
    rolesError: computed(() => query.rolesError.value?.message || null),
    total: query.total,
    totalPages: query.totalPages,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    status: query.status,
    refreshRoles: query.refreshRoles,
    getRole: query.getRole,
    updateRole: query.updateRole,
    deleteRole: query.deleteRole,
  }
}
