<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { ListRolesParams, Role } from '~/features/roles/domain'
import type { Page } from '~/lib/transport'

import { useGlobalDialog } from '~/composables/useDialog'
import CreateRoleDialog from '~/features/roles/components/CreateRoleDialog.vue'
import { useRolesQueries } from '~/features/roles/useRolesQueries'

const permissions = useRolePermissions()

// ---------------------------------------------
// Columns
// ---------------------------------------------
const columns: ColumnDef<Role>[] = [
  {
    accessorKey: 'roleNumber',
    header: 'Role ID',
    enableSorting: false,
    cell: ({ row }) =>
      h('div', {
        class: 'cursor-pointer text-blue-600 hover:underline',
        onClick: () => {
          navigateTo(`/users/roles/${row.original.id}`)
        },
      }, row.original.roleNumber || '-'),
  },
  {
    accessorKey: 'name',
    header: 'Role Name',
    enableSorting: false,
    cell: ({ row }) => h('div', {}, row.original.name),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const isActive = row.original.status
      return h('div', {
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`,
      }, [
        h('span', {
          class: `w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-600' : 'bg-red-600'}`,
        }),
        isActive ? 'Active' : 'Non Active',
      ])
    },
  },
]

// ---------------------------------------------
// Server-side params (sinkron sama route.query)
// page = 1-based
// ---------------------------------------------
const route = useRoute()
const qc = useQueryClient()
const rolesQuery = useRolesQueries()

const listParams = computed<ListRolesParams>(() => {
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
const listQ = rolesQuery.useListQuery(listParams, {
  initialData: () => ({ items: [], total: 0, totalPages: 0, page: 1, pageSize: 10 } as Page<Role>),
})

const isLoadingRoles = computed(() => listQ.isPending.value || listQ.isFetching.value)
const errorMessage = computed(() => listQ.isError.value ? (listQ.error.value as Error)?.message ?? 'Unknown error' : '')

// ---------------------------------------------
// Server-side change handler dari CnDataTable
// Argumen tipe kira-kira seperti ini — adjust kalau beda:
// { pageIndex, pageSize, sort?: {id, desc}|null, search?: string, filters?: { status?: string } }
// ---------------------------------------------
async function handleServerSideChange(params: {
  page: number
  pageSize: number
  sorting: TableSorting[]
  filters: TableFilters
}): Promise<TableData<Role>> {
  const primary = params.sorting?.[0]
  const sort = primary?.field
  const order: 'asc' | 'desc' | undefined
    = primary ? (('desc' in primary ? primary.desc : primary?.direction === 'desc') ? 'desc' : 'asc') : undefined

  const status = (params.filters?.status as string | undefined) || undefined
  const search
    = (params.filters?.q as string | undefined)
      ?? (params.filters?.search as string | undefined)
      ?? ''

  const nextParams: ListRolesParams = {
    page: params.page,
    pageSize: params.pageSize,
    search,
    sort,
    order,
    status,
  }

  // ❇️ Force fetch fresh data instead of relying on cache
  try {
    await rolesQuery.prefetchList(qc, nextParams)

    // ambil hasilnya dari cache (samain key)
    const cached = qc.getQueryData<Page<Role>>(rolesQuery.keys.list(nextParams))

    // // Kalau cache kosong setelah prefetch, langsung fetch
    // if (!cached) {
    //   const { $repos } = useNuxtApp()
    //   cached = await $repos.roles.list(nextParams)
    //   // Set ke cache biar konsisten
    //   qc.setQueryData(rolesQuery.keys.list(nextParams), cached)
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
    console.error('Failed to fetch roles:', error)
    return {
      data: [],
      page: params.page,
      pageSize: params.pageSize,
      total: 0,
      totalPages: 0,
    }
  }
}

// Dialog instance
const dialog = useGlobalDialog()

// Handle create role
function handleCreateRole() {
  dialog.open(
    CreateRoleDialog,
    {},
    {
      title: 'Create New Role',
      size: 'md',
      closable: true,
      description: 'Create new role with filling register information form below.',
    },
  )
}

// Filter options for the table
const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Active', value: 'true' },
      { label: 'Non Active', value: 'false' },
    ],
  },
]

useHead({ title: 'Users Roles' })
</script>

<template>
  <div>
    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm text-red-800 font-medium dark:text-red-200">
            Error loading roles
          </h3>
          <div class="text-sm text-red-700 mt-2 dark:text-red-300">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- DataTable -->
    <CnDataTable
      :key="`roles-table-${listQ.data.value?.total}`"
      title="All Roles"
      :columns="columns"
      :data="listQ.data.value.items || []"
      :filter-options="filterOptions"
      :loading="isLoadingRoles"
      :on-server-side-change="handleServerSideChange"
      :page-size-options="[10, 20, 50, 100]"
      :show-column-visibility="false"
      empty-message="No roles found. Try adjusting your search or filters."
      search-placeholder="Search roles by name..."
      server-side
      :url-sync="false"
    >
      <!-- Custom actions in toolbar -->
      <template #actions>
        <CnButton
          v-if="permissions.create?.value"
          variant="outline"
          class="text-red-500 border-red-500 h-10 hover:text-red-500 hover:bg-red-500/10"
          @click="handleCreateRole"
        >
          <Icon name="ph:plus" class="h-4 w-4" />
          Create Role
        </CnButton>
      </template>
    </CnDataTable>
  </div>
</template>
