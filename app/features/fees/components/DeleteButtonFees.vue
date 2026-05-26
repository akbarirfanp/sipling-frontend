<script setup lang="ts">
import { useFees } from '~/features/fees/useFeesQuery'

const props = defineProps<{
  feeId: string
  loading: boolean
}>()

const confirmDialog = useConfirmDialog()

const router = useRouter()
const { deleteFee } = useFees()
const loadingDelete = ref(false)

async function handleDeleteFee() {
  const confirmed = await confirmDialog.confirm({
    type: 'confirmation',
    title: 'Hapus Iuran?',
    message: 'Anda yakin ingin menghapus iuran?',
    confirmText: 'Hapus',
    cancelText: 'Cancel',
  })

  if (!confirmed)
    return

  try {
    await deleteFee(props.feeId)

    // tampilkan alert success
    await confirmDialog.confirm({
      type: 'alert',
      title: 'Success',
      message: 'Iuran berhasil dihapus',
      confirmText: 'OK',
    })

    router.back()
  }
  catch (err) {
    await confirmDialog.confirm({
      type: 'error',
      title: 'Failed',
      message: err instanceof Error ? err.message : 'Gagal menghapus iuran',
      confirmText: 'OK',
    })
  }
}
</script>

<template>
  <div>
    <CnButton
      class="text-red-600 mt-5 py-4 border border-red-600 bg-white h-10 w-full hover:bg-red-50"
      :disabled="loadingDelete || loading"
      @click="handleDeleteFee"
    >
      <Icon name="ph:trash" class="mr-2 h-5 w-5" />
      Hapus Iuran
    </CnButton>
  </div>
</template>
