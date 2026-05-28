<script setup lang="ts">
import type { RolePermissionCmd } from '~/features/roles/domain'
import EditButtonRole from '~/features/roles/components/EditButtonRole.vue'
import { useRolesQueries } from '~/features/roles/useRolesQueries'

const permissionCheck = useRolePermissions()

// Get route params
const route = useRoute('users-roles-id')
const roleId = computed(() => route.params.id)

// Use roles queries
const rolesQueries = useRolesQueries()
const { data: roleData, isLoading, error, refetch } = rolesQueries.useDetailQuery(roleId)
const setRolePermMutation = rolesQueries.useSetRolePerm(roleId)

// Toast untuk notifications
const { toast } = useToast()

// Edit role ref
const editRoleRef = ref()

// Edit mode state
const isEditMode = ref(false)
const editPermissions = ref<string[]>([])

// Helper to convert Date to string for Timestamp component
function toISOString(date: Date | string | null | undefined): string | null | undefined {
  if (!date)
    return date as null | undefined
  if (typeof date === 'string')
    return date
  return date.toISOString()
}

function handleEditRole() {
  editRoleRef.value?.handleEdit()
}

async function handleEditSuccess() {
  await refetch()
}

// Get all available permissions from API
const { data: allPermissions, isLoading: isLoadingPermissions } = rolesQueries.useGetPermissions()

// Transform permissions data for table display
const permissions = computed(() => {
  if (!allPermissions.value || !roleData.value) {
    return []
  }

  const rolePermissions = roleData.value.permissions || []
  const modules = Object.keys(allPermissions.value)

  return modules.map((module) => {
    const modulePermissions = allPermissions.value![module] || []

    // Check each permission type for this module
    const getPermissionStatus = (action: string) => {
      const permissionName = `${module.toLowerCase()}.${action}`
      return rolePermissions.some(p =>
        p.name === permissionName && !p.pivot.isForbidden,
      )
    }

    // Check if module has specific permission types available
    const hasAccessPermission = modulePermissions.some(p => p.name.endsWith('.access'))
    const hasViewPermission = modulePermissions.some(p => p.name.endsWith('.view'))
    const hasCreatePermission = modulePermissions.some(p => p.name.endsWith('.create'))
    const hasEditPermission = modulePermissions.some(p => p.name.endsWith('.edit'))
    const hasDeletePermission = modulePermissions.some(p => p.name.endsWith('.delete'))

    return {
      module: module.charAt(0).toUpperCase() + module.slice(1),
      access: hasAccessPermission ? getPermissionStatus('access') : false,
      view: hasViewPermission ? getPermissionStatus('view') : false,
      create: hasCreatePermission ? getPermissionStatus('create') : false,
      edit: hasEditPermission ? getPermissionStatus('edit') : false,
      delete: hasDeletePermission ? getPermissionStatus('delete') : false,

      hasAccessPermission,
      hasViewPermission,
      hasCreatePermission,
      hasEditPermission,
      hasDeletePermission,
    }
  })
})

// Initialize edit permissions when role data changes
watch(roleData, (newRoleData) => {
  if (newRoleData?.permissions) {
    editPermissions.value = newRoleData.permissions
      .filter(p => !p.pivot.isForbidden)
      .map(p => p.name)
  }
}, { immediate: true })

// Handle edit mode toggle
function handleEditPermissions() {
  isEditMode.value = true
  // Reset edit permissions to current role permissions
  if (roleData.value?.permissions) {
    editPermissions.value = roleData.value.permissions
      .filter(p => !p.pivot.isForbidden)
      .map(p => p.name)
  }
}

// Handle cancel edit
function handleCancelEdit() {
  isEditMode.value = false
  editPermissions.value = []
}

// Handle save changes
async function handleSaveChanges() {
  try {
    const payload: RolePermissionCmd = {
      permissions: editPermissions.value,
    }

    await setRolePermMutation.mutateAsync(payload)

    toast('Permissions updated successfully', {
      description: 'Role permissions have been updated.',
    })

    isEditMode.value = false
  }
  catch (error: any) {
    console.error('Failed to update permissions:', error)

    toast('Failed to update permissions', {
      description: error?.message || 'An unexpected error occurred. Please try again.',
    })
  }
}

// Handle permission toggle
function handlePermissionToggle(permissionName: string, checked: boolean) {
  if (checked) {
    if (!editPermissions.value.includes(permissionName)) {
      editPermissions.value.push(permissionName)
    }
  }
  else {
    editPermissions.value = editPermissions.value.filter(p => p !== permissionName)
  }
}

// Check if permission is selected in edit mode
function isPermissionSelected(permissionName: string) {
  return editPermissions.value.includes(permissionName)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Role Detail
      </h1>
    </div>

    <!-- Main Content Grid -->
    <div class="gap-6 grid grid-cols-1 lg:grid-cols-3">
      <!-- Left Column - Role Info -->
      <div class="space-y-4 lg:col-span-2">
        <!-- Main Role Info Card -->
        <CnCard>
          <CnCardHeader class="pb-4 flex flex-row items-center justify-between space-y-0">
            <CnCardTitle class="text-xl">
              <template v-if="isLoading">
                Loading...
              </template>
              <template v-else-if="error">
                Error loading role
              </template>
              <template v-else>
                {{ roleData?.name || 'Unknown Role' }}
              </template>
            </CnCardTitle>
            <CnButton v-if="permissionCheck.edit?.value" variant="ghost" size="icon" :disabled="isLoading" @click="handleEditRole">
              <Icon name="ph:pencil-simple" :size="16" />
            </CnButton>
          </CnCardHeader>
          <CnCardContent class="space-y-4">
            <!-- Status Badge -->
            <div class="flex gap-2 items-center">
              <div :class="roleData?.status ? 'bg-green-500' : 'bg-red-500'" class="rounded-full h-2 w-2" />
              <span :class="roleData?.status ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
                {{ roleData?.status ? 'Active' : 'Non Active' }}
              </span>
            </div>

            <!-- Role Number -->
            <div>
              <p class="text-sm text-muted-foreground mb-1">
                Role Number
              </p>
              <p class="font-medium">
                {{ roleData?.roleNumber || 'N/A' }}
              </p>
            </div>
          </CnCardContent>
        </CnCard>

        <CnCard class="flex-1">
          <CnCardHeader>
            <div class="flex items-center justify-between">
              <CnCardTitle>Access Privileges</CnCardTitle>
              <div class="flex gap-2">
                <template v-if="!isEditMode">
                  <CnButton
                    v-if="permissionCheck.editPermission?.value"
                    variant="outline"
                    size="sm"
                    :disabled="isLoading || isLoadingPermissions"
                    @click="handleEditPermissions"
                  >
                    <Icon name="ph:pencil-simple" :size="16" class="mr-2" />
                    Edit Permissions
                  </CnButton>
                </template>
                <template v-else>
                  <CnButton
                    variant="outline"
                    size="sm"
                    :disabled="setRolePermMutation.isPending.value"
                    @click="handleCancelEdit"
                  >
                    <Icon name="ph:x" :size="16" class="mr-2" />
                    Cancel
                  </CnButton>
                  <CnButton
                    size="sm"
                    :disabled="setRolePermMutation.isPending.value"
                    @click="handleSaveChanges"
                  >
                    <Icon name="ph:check" :size="16" class="mr-2" />
                    Save Changes
                  </CnButton>
                </template>
              </div>
            </div>
          </CnCardHeader>
          <CnCardContent>
            <!-- Permissions Table -->
            <div v-if="isLoadingPermissions || isLoading" class="py-8 flex items-center justify-center">
              <div class="text-muted-foreground">
                Loading permissions...
              </div>
            </div>
            <div v-else-if="setRolePermMutation.isPending.value" class="py-8 flex items-center justify-center">
              <div class="text-muted-foreground flex gap-2 items-center">
                <Icon name="ph:spinner" :size="16" class="animate-spin" />
                Saving permissions...
              </div>
            </div>
            <CnTable v-else>
              <CnTableHeader>
                <CnTableRow>
                  <CnTableHead class="text-left">
                    Module
                  </CnTableHead>
                  <CnTableHead class="text-center">
                    Access
                  </CnTableHead>
                  <CnTableHead class="text-center">
                    View
                  </CnTableHead>
                  <CnTableHead class="text-center">
                    Create
                  </CnTableHead>
                  <CnTableHead class="text-center">
                    Edit
                  </CnTableHead>
                  <CnTableHead class="text-center">
                    Delete
                  </CnTableHead>
                </CnTableRow>
              </CnTableHeader>
              <CnTableBody>
                <CnTableRow v-if="permissions.length === 0">
                  <CnTableCell colspan="6" class="text-muted-foreground py-8 text-center">
                    No permissions data available
                  </CnTableCell>
                </CnTableRow>
                <CnTableRow v-for="permission in permissions" :key="permission.module">
                  <CnTableCell class="font-medium">
                    {{ permission.module }}
                  </CnTableCell>
                  <CnTableCell class="text-center">
                    <CnCheckbox
                      :model-value="isEditMode ? isPermissionSelected(`${permission.module.toLowerCase()}.access`) : permission.access"
                      :disabled="!isEditMode || !permission.hasAccessPermission"
                      class="mx-auto"
                      @update:model-value="(checked: boolean | 'indeterminate') => isEditMode && typeof checked === 'boolean' && handlePermissionToggle(`${permission.module.toLowerCase()}.access`, checked)"
                    />
                  </CnTableCell>
                  <CnTableCell class="text-center">
                    <CnCheckbox
                      :model-value="isEditMode ? isPermissionSelected(`${permission.module.toLowerCase()}.view`) : permission.view"
                      :disabled="!isEditMode || !permission.hasViewPermission"
                      class="mx-auto"
                      @update:model-value="(checked: boolean | 'indeterminate') => isEditMode && typeof checked === 'boolean' && handlePermissionToggle(`${permission.module.toLowerCase()}.view`, checked)"
                    />
                  </CnTableCell>
                  <CnTableCell class="text-center">
                    <CnCheckbox
                      :model-value="isEditMode ? isPermissionSelected(`${permission.module.toLowerCase()}.create`) : permission.create"
                      :disabled="!isEditMode || !permission.hasCreatePermission"
                      class="mx-auto"
                      @update:model-value="(checked: boolean | 'indeterminate') => isEditMode && typeof checked === 'boolean' && handlePermissionToggle(`${permission.module.toLowerCase()}.create`, checked)"
                    />
                  </CnTableCell>
                  <CnTableCell class="text-center">
                    <CnCheckbox
                      :model-value="isEditMode ? isPermissionSelected(`${permission.module.toLowerCase()}.edit`) : permission.edit"
                      :disabled="!isEditMode || !permission.hasEditPermission"
                      class="mx-auto"
                      @update:model-value="(checked: boolean | 'indeterminate') => isEditMode && typeof checked === 'boolean' && handlePermissionToggle(`${permission.module.toLowerCase()}.edit`, checked)"
                    />
                  </CnTableCell>
                  <CnTableCell class="text-center">
                    <CnCheckbox
                      :model-value="isEditMode ? isPermissionSelected(`${permission.module.toLowerCase()}.delete`) : permission.delete"
                      :disabled="!isEditMode || !permission.hasDeletePermission"
                      class="mx-auto"
                      @update:model-value="(checked: boolean | 'indeterminate') => isEditMode && typeof checked === 'boolean' && handlePermissionToggle(`${permission.module.toLowerCase()}.delete`, checked)"
                    />
                  </CnTableCell>
                </CnTableRow>
              </CnTableBody>
            </CnTable>
          </CnCardContent>
        </CnCard>
      </div>

      <div class="flex flex-col lg:col-span-1">
        <Timestamp
          :created-by="roleData?.createdBy"
          :created-at="toISOString(roleData?.createdAt)"
          :updated-by="roleData?.updatedBy"
          :updated-at="toISOString(roleData?.updatedAt)"
          :loading="isLoading"
        />

        <EditButtonRole
          ref="editRoleRef"
          :role-id="roleId"
          :role-name="roleData?.name || ''"
          :status="roleData?.status"
          @edit-success="handleEditSuccess"
        />
      </div>
    </div>
  </div>
</template>
