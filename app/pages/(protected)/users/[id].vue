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
        Detail Pengguna
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

      </div>
      <div>
        <Timestamp
          :created-at="user?.createdAt"
          :updated-at="user?.updatedAt"
        />
        <CnButton
          class="mt-6 py-4 bg-primary h-10 w-full hover:bg-primary/80"
          @click="showPassword = true"
        >
          Ubah Password
        </CnButton>
        <CreateButtonPassword
          v-model:show="showPassword"
          title="Ubah Password"
          description="Isi form dibawah untuk mengubah password pengguna"
          primary-button-label="Simpan"
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
