<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import DetailSection from '~/components/DetailSection.vue'
import Timestamp from '~/components/Timestamp.vue'
import CreateButtonPassword from '~/features/users/components/CreateButtonPassword.vue'
import DeleteButtonUser from '~/features/users/components/DeleteButtonUser.vue'
import EditButtonUser from '~/features/users/components/EditButtonUser.vue'
import { useUsersQuery } from '~/features/users/useUsersQuery'

const {
  confirm,
  success,
  error,
} = useConfirmDialog()

const qc = useQueryClient()
const route = useRoute()
const userId = computed(() => 'id' in route.params ? route.params.id as string : '')
const updateUserRef = ref()
// ambil user detail pakai vue-query
const query = useUsersQuery().useUserQuery(userId)
const user = computed(() => query.data.value)
const showPassword = ref(false)

const { changePassword } = useUsersQuery()

function handleEditUser() {
  updateUserRef.value?.handleEdit()
}

// handle change password
async function handleChangePassword(payload: { password: string, passwordConfirmation: string, currentPassword?: string }) {
  try {
    // contoh call API ganti password
    const ok = await confirm({
      type: 'confirmation',
      title: 'Change Password?',
      message: 'Are you sure you want to change this user\'s password?',
      confirmText: 'Yes',
      cancelText: 'Cancel',
    })

    if (!ok)
      return

    // Langsung kirim payload dengan camelCase
    await changePassword(userId.value, payload)

    // refetch detail (last updated)
    await query.refetch()
    // refresh log
    await qc.refetchQueries({ queryKey: ['log-application'] })
    await success('Success', 'Password updated successfully')
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to change password'
    await error('Failed', message)
  }
}

async function handleEditUserSuccess() {
  await query.refetch()

  // refresh log
  await qc.refetchQueries({ queryKey: ['log-application'] })
}

const userData = computed(() => {
  return query.data.value
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        User Detail
      </h1>
    </div>

    <div class="gap-4 grid grid-cols-1 md:grid-cols-3">
      <div class="md:col-span-2">
        <DetailSection
          label-class="text-sm text-muted-foreground mb-1"
          value-class="font-medium"
          :show-avatar="true"
          :editable="true"
          :name="user?.name ?? ''"
          :status="Boolean(user?.status)"
          :fields="[
            { label: 'Username', value: user?.username ?? '' },
            { label: 'Email', value: user?.email ?? '' },
            { label: 'Role', value: user?.roles?.name ?? '' },
            { label: 'Alamat', value: user?.address ?? '' },
          ]"
          @edit="handleEditUser"
        />

        <CnCard class="p-6">
          <CnTabs default-value="log" class="gap-6 w-full">
            <CnTabsList class="h-11 w-auto">
              <CnTabsTrigger value="log" class="px-3 cursor-pointer">
                Log
              </CnTabsTrigger>
            </CnTabsList>
            <CnTabsContent value="log" class="mt-6 border rounded-md rounded-md">
              <LogApplication entity-type="users" :entity-id="userId" />
            </CnTabsContent>
          </CnTabs>
        </CnCard>
      </div>
      <div>
        <Timestamp
          :created-at="user?.createdAt"
          :updated-at="user?.updatedAt"
        />
        <CnButton
          class="mt-6 py-4 bg-red-600 h-10 w-full hover:bg-red-700"
          @click="showPassword = true"
        >
          Change Password
        </CnButton>
        <CreateButtonPassword
          v-model:show="showPassword"
          title="Change Password"
          description="Update your password to keep your account secure."
          primary-button-label="Save"
          mode="change"
          @save="handleChangePassword"
        />
        <DeleteButtonUser
          :user-id="userId"
          :loading="false"
        />
      </div>
    </div>
    <EditButtonUser
      v-if="userData"
      ref="updateUserRef"
      :user="userData"
      @edit-success="handleEditUserSuccess"
    />
  </div>
</template>
