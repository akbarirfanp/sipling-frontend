<script setup lang="ts">
import { useUsers } from '~/features/users/useUsersQuery'

const props = defineProps<{
  userId: string
  loading: boolean
}>()

const confirmDialog = useConfirmDialog()

const router = useRouter()
const { deleteUser } = useUsers()
const loadingDelete = ref(false)

async function handleDeleteUser() {
  const confirmed = await confirmDialog.confirm({
    type: 'confirmation',
    title: 'Delete User?',
    message: 'Are you sure you want to delete this user?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })

  if (!confirmed)
    return

  try {
    await deleteUser(props.userId)

    // tampilkan alert success
    await confirmDialog.confirm({
      type: 'alert',
      title: 'Success',
      message: 'User deleted successfully!',
      confirmText: 'OK',
    })

    router.back()
  }
  catch (err) {
    await confirmDialog.confirm({
      type: 'error',
      title: 'Failed',
      message: err instanceof Error ? err.message : 'Unable to delete user',
      confirmText: 'OK',
    })
  }
}
</script>

<template>
  <div>
    <CnButton
      class="text-red-600 mt-2 py-4 border border-red-600 bg-white h-10 w-full hover:bg-red-50"
      :disabled="loadingDelete || loading"
      @click="handleDeleteUser"
    >
      <Icon name="ph:trash" class="mr-2 h-5 w-5" />
      Delete User
    </CnButton>
  </div>
</template>
