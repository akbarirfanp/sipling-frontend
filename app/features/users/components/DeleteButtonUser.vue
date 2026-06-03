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
    title: 'Hapus Pengguna?',
    message: 'Apakah anda yakin ingin menghapus pengguna ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed)
    return

  try {
    await deleteUser(props.userId)

    // tampilkan alert success
    await confirmDialog.confirm({
      type: 'alert',
      title: 'Berhasil',
      message: 'Pengguna berhasil dihapus!',
      confirmText: 'OK',
    })

    router.back()
  }
  catch (err) {
    await confirmDialog.confirm({
      type: 'error',
      title: 'Gagal',
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
      Hapus Pengguna
    </CnButton>
  </div>
</template>
