<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type FormDialog from '../FormDialog.vue'
import type { User } from '~/features/users/domain'
import { computed, h, ref, watch } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useQueueMembersQuery } from '~/features/queueMembers/useQueueMembersQuery'
import { useUsersQuery } from '~/features/users/useUsersQuery'

type MemberType = 'queue'

const props = defineProps<{
  parentId?: string
  memberType: MemberType
}>()

const emit = defineEmits<{
  usersAdded: []
}>()

const {
  users,
  total,
  totalPages,
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
  memberQueue,
  refreshUsers: _refreshUsers,
  isLoadingUsers: _isLoadingUsers,
} = useUsersQuery('addUsers')

const { createQueueMembers } = useQueueMembersQuery(props?.parentId || '')

const dialogRef = ref<typeof FormDialog>()
const pageIndex = ref(0)
const statusFilter = ref<string>('')
const selectedUserIds = ref<string[]>([])

const config = computed(() => {
  const configs = {
    queue: {
      dialogTitle: 'Select User',
      buttonLabel: 'Add User',
      confirmTitle: 'Submit Add User?',
      confirmMessage: 'Are you sure you want to add the selected user(s) to this role?',
      successMessage: 'Selected user(s) have been successfully added.',
      errorMessage: 'Failed to add user. Please check your connection or try again.',
      addFunction: createQueueMembers,
    },
  }
  return configs[props.memberType]
})

const dialogTitle = computed(() => config.value.dialogTitle)
const buttonLabel = computed(() => config.value?.buttonLabel || 'Add User')

const selectedUsers = computed(() =>
  users.value.filter(u => selectedUserIds.value.includes(u.id)),
)

const isAllSelected = computed(() =>
  selectedUserIds.value.length === users.value.length && users.value.length > 0,
)

const isIndeterminate = computed(() =>
  selectedUserIds.value.length > 0 && selectedUserIds.value.length < users.value.length,
)

const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
]

async function fetchUsers(params: {
  page: number
  pageSize: number
  search?: string
  sorting?: TableSorting[]
  filters?: TableFilters
}): Promise<TableData<User>> {
  try {
    // Update useUsers params
    page.value = params.page
    pageSize.value = 5
    search.value = params.search || ''
    switch (props.memberType) {
      case 'queue':
        memberQueue.value = 'false'
        break
    }

    // Handle sorting
    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0]
      if (sort) {
        sortBy.value = sort.field
        sortOrder.value = sort.direction
      }
    }
    else {
      sortBy.value = ''
      sortOrder.value = ''
    }

    // Handle filters - PERBAIKAN
    if (params.filters && Array.isArray(params.filters)) {
      const statusFilterParam = params.filters.find(f => f.id === 'status')
      if (statusFilterParam && statusFilterParam.value) {
        statusFilter.value = statusFilterParam.value
        const currentQuery = params.search || ''
        const statusQuery = `status:${statusFilterParam.value}`
        if (currentQuery && !currentQuery.includes('status:')) {
          search.value = `${currentQuery} ${statusQuery}`
        }
        else if (!currentQuery) {
          search.value = statusQuery
        }
        else {
          search.value = currentQuery.replace(/status:\w+/g, statusQuery)
        }
      }
      else {
        statusFilter.value = ''

        if (search.value.includes('status:')) {
          search.value = search.value.replace(/\s*status:\w+/g, '').trim()
        }
      }
    }
    else {
      statusFilter.value = ''
      if (search.value.includes('status:')) {
        search.value = search.value.replace(/\s*status:\w+/g, '').trim()
      }
    }
    await _refreshUsers()

    return {
      data: users.value || [],
      total: total.value || 0,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: totalPages.value || 1,
    }
  }
  catch (error) {
    console.error('Failed to fetch users:', error)
    return {
      data: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: 1,
    }
  }
}

const baseColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'number',
    header: 'User ID',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {
        class: 'text-blue-600 font-medium',
      }, user.number || '-')
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {
        class: 'font-medium text-gray-900 dark:text-gray-100',
      }, user.name)
    },
  },
  {
    accessorKey: 'username',
    header: 'Username',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {
        class: 'text-muted-foreground',
      }, user.username || '-')
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      return h('div', {
        class: 'text-muted-foreground',
      }, user.email || '-')
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original
      const isActive = user.status
      return h('span', {
        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`,
      }, isActive ? 'Active' : 'Inactive')
    },
  },
]

function handleSelectAll(value: boolean | 'indeterminate') {
  const checked = value === true
  if (checked) {
    selectedUserIds.value = users.value.map(u => u.id)
  }
  else {
    selectedUserIds.value = []
  }
}

function handleSelectRow(row: User, value: boolean | 'indeterminate') {
  const checked = value === true
  if (checked) {
    if (!selectedUserIds.value.includes(row.id)) {
      selectedUserIds.value = [...selectedUserIds.value, row.id]
    }
  }
  else {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== row.id)
  }
}

const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: () => {
      return h(Checkbox, {
        'modelValue': isAllSelected.value,
        'indeterminate': isIndeterminate.value,
        'onUpdate:modelValue': handleSelectAll,
      })
    },
    cell: ({ row }) => {
      const isChecked = computed(() =>
        selectedUserIds.value.includes(row.original.id),
      )

      return h(Checkbox, {
        'modelValue': isChecked.value,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => handleSelectRow(row.original, value),
      })
    },
    enableSorting: false,
    enableHiding: false,
  },
  ...baseColumns,
]

watch(
  () => users.value,
  () => {
    selectedUserIds.value = selectedUserIds.value.filter(id =>
      users.value.some(user => user.id === id),
    )
  },
  { deep: true },
)
const confirmDialog = useConfirmDialog()

async function handleSave() {
  const currentConfig = config.value
  const confirmed = await confirmDialog.confirm({
    title: currentConfig.confirmTitle,
    message: currentConfig.confirmMessage,
    confirmText: 'Submit',
    cancelText: 'Cancel',
    type: 'confirmation',
  })

  if (!confirmed) {
    return false
  }

  try {
    await currentConfig.addFunction({ userIds: selectedUserIds.value })

    // Close dialog immediately after successful save
    dialogRef.value?.openDialog(false)

    await confirmDialog.success(
      'Success',
      currentConfig.successMessage,
    )
    selectedUserIds.value = []
    await _refreshUsers()
    emit('usersAdded')
    return true
  }
  catch (err: any) {
    const error = err?.data?.data ?? {}
    const errorMessage
      = error.message || 'Failed to create queue . Please check your connection or try again.'
    await confirmDialog.error('Error', errorMessage)
    return false
  }
}

async function handleDialogOpen() {
  selectedUserIds.value = []
  // Fetch users when dialog is opened
  await _refreshUsers()
}

async function refreshAddUsers() {
  await _refreshUsers()
  selectedUserIds.value = []
  pageIndex.value = 0
}

defineExpose({
  refreshAddUsers,
})
</script>

<template>
  <FormDialog
    ref="dialogRef"
    :title="dialogTitle"
    description=""
    :button-label="buttonLabel"
    primary-button-label="Add"
    secondary-button-label="Back"
    button-direction="horizontal"
    :on-save="handleSave"
    :on-open="handleDialogOpen"
    width="w-[960px]"
    height="max-h-[90vh]"
    loading-text="Save in progress..."
    :disable-submit="!props.parentId || selectedUsers.length === 0"
  >
    <template #fields>
      <div class="space-y-4">
        <CnDataTable
          :columns="columns"
          :data="users"
          :server-side="true"
          :on-server-side-change="fetchUsers"
          search-placeholder="Search users..."
          :show-page-options="false"
          :loading="_isLoadingUsers"
          :show-column-visibility="false"
          :filter-options="filterOptions"
          :url-sync="false"
          table-id="dialog"
        />
      </div>
    </template>
  </FormDialog>
</template>
