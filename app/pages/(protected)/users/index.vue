<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { TableData, TableFilters, TableSorting } from '~/composables/useTable'
import type { ListUsersParams, User } from '~/features/users/domain'
import type { Page } from '~/lib/transport'
import { useUsersQueries } from '~/features/users/useUsersQueries'

// Define columns for the table
const columns: ColumnDef<User>[] = [
{
  accessorKey: 'name',
  header: 'Name',
  enableSorting: false,
  cell: ({ row }) =>
    h('div', {
      class: 'cursor-pointer text-blue-600 hover:underline',
      onClick: () => {
        navigateTo(`/users/${row.original.id}`)
      },
    }, row.original.name || '-'),
},
  {
    accessorKey: 'username',
    header: 'Username',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {}, user.username || '-')
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {}, user.email || '-')
    },
  },
  {
    accessorKey: 'address',
    header: 'Alamat',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {}, user.address || '-')
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      const isActive = user.status
      return h('div', {
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`,
      }, isActive ? 'Active' : 'Non Active')
    },
  },
]

const route = useRoute()
const qc = useQueryClient()
const usersQuery = useUsersQueries()

const listParams = computed<ListUsersParams>(() => {
  const page = Math.max(1, Number(route.query.page) || 1)
  const pageSize = Math.max(1, Number((route.query).size ?? (route.query).pageSize) || 10)

  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const sort = typeof route.query.sort === 'string' ? route.query.sort : undefined
  const order = route.query.order === 'desc'
    ? 'desc' as const
    : route.query.order === 'asc'
      ? 'asc' as const
      : undefined
  const status = typeof route.query.status === 'string' ? route.query.status : undefined

  return { page, pageSize, search: q, sort, order, status }
})

// query ke BE (otomatis re-fetch kalau route.query berubah, krn listParams computed)
const listQ = usersQuery.useListQuery(listParams, {
  initialData: () => ({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 } as Page<User>),
})

const isLoadingUsers = computed(() => listQ.isPending.value || listQ.isFetching.value)
const errorMessage = computed(() => listQ.isError.value ? (listQ.error.value as Error)?.message ?? 'Unknown error' : '')

// Fetch function for the table using useUsers composable
// Handle server-side changes - sesuai dengan interface yang diharapkan useTable
async function handleServerSideChange(params: {
  page: number
  pageSize: number
  sorting: TableSorting[]
  filters: TableFilters
}): Promise<TableData<User>> {
  const status = (params.filters?.status as string | undefined) || undefined
  const search
    = (params.filters?.q as string | undefined)
      ?? (params.filters?.search as string | undefined)
      ?? ''

  const nextParams: ListUsersParams = {
    page: params.page,
    pageSize: params.pageSize,
    search,
    status,
  }

  // ❇️ Force fetch fresh data instead of relying on cache
  try {
    await usersQuery.prefetchList(qc, nextParams)

    // ambil hasilnya dari cache (samain key)
    const cached = qc.getQueryData<Page<User>>(usersQuery.keys.list(nextParams))

    // // Kalau cache kosong setelah prefetch, langsung fetch
    // if (!cached) {
    //   const { $repos } = useNuxtApp()
    //   cached = await $repos.users.list(nextParams)
    //   // Set ke cache biar konsisten
    //   qc.setQueryData(usersQuery.keys.list(nextParams), cached)
    // }

    return {
      data: cached?.items ?? [],
      page: params.page,
      pageSize: params.pageSize,
      total: cached?.total ?? 0,
      totalPages: cached?.totalPages ?? 0,
    }
  }
  catch (error) {
    console.error('Failed to fetch users:', error)
    return {
      data: [],
      page: params.page,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    }
  }
}

// Navigate to create user page
function navigateToCreate() {
  navigateTo('/users/create-user')
}

// Set page title
useHead({
  title: 'User Management',
})
</script>

<template>
  <div class="mx-auto py-6 container">
    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm text-red-800 font-medium dark:text-red-200">
            Error loading users
          </h3>
          <div class="text-sm text-red-700 mt-2 dark:text-red-300">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <CnCard class="flex flex-1 flex-col min-h-0">
      <div class="p-6 overflow-x-auto overflow-y-visible">
        <CnDataTable
          :key="`users-table-${listQ.data.value?.total}`"
          title="Manajemen Warga"
          :columns="columns"
          :data="listQ.data.value?.items ?? []"
          server-side
          :on-server-side-change="handleServerSideChange"
          search-placeholder="Cari warga..."
          :page-size-options="[10, 20, 50, 100]"
          :loading="isLoadingUsers"
          :show-column-visibility="false"
          empty-message="No users found. Try adjusting your search or filters."
          :url-sync="false"
        >
          <template #actions>
            <CnButton
              variant="outline"
              class="text-primary border-primary h-10 hover:text-primary hover:bg-primary/10"
              @click="navigateToCreate"
            >
              <Icon name="ph:plus" class="h-4 w-4" />
              Create User
            </CnButton>
          </template>
        </CnDataTable>
      </div>
    </CnCard>
  </div>
</template>
