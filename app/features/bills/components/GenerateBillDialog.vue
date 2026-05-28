<script setup lang="ts">
import type { GenerateBillCmd, Bill } from '../domain'
import type { GenerateBillFormData } from '../forms/schema'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { generateBillSchema } from '~/features/bills/forms/schema'
import { useFeesQueries } from '~/features/fees/useFeesQueries'
import { useBillsQuery } from '~/features/bills/useBillsQuery'
import type { Fee } from '~/features/fees/domain'

interface Props {
  onClose?: () => void
  onSuccess?: (bill: Bill) => void
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  onClose: () => {},
  onSuccess: () => {},
  onError: () => {},
})

// ✅ UBAH: setup form pakai generateBillSchema (feeId + dueDate)
const formSchema = toTypedSchema(generateBillSchema)
const { handleSubmit, isSubmitting, resetForm, setFieldError } = useForm({
  validationSchema: formSchema,
  initialValues: {
    feeId: '',
    dueDate: '',
  } as GenerateBillFormData,
})

const confirmDialog = useConfirmDialog()
const { generateBillMutation } = useBillsQuery()

const feesQuery = useFeesQueries()
const feesListQuery = feesQuery.useListQuery()

const feeOptions = computed(() => {
  const list = (feesListQuery.data?.value as any)?.items 
    ?? (feesListQuery.data?.value as any)?.data 
    ?? []
  return list.map((f: Fee) => ({
    value: f.id,
    label: f.name ?? '',
  }))
})

// ✅ SAMA seperti sebelumnya, tidak ada yang diubah di onSubmit
const onSubmit = handleSubmit(async (values: GenerateBillFormData) => {
  const confirmed = await confirmDialog.confirm({
    title: 'Generate Bill?',
    message: 'Pastikan jenis iuran dan tanggal jatuh tempo sudah benar sebelum generate.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'confirmation',
  })

  if (!confirmed) return false

  const generateBillCmd: GenerateBillCmd = {
    feeId: values.feeId,
    dueDate: values.dueDate,
  }

  try {
    const result: Bill = await generateBillMutation.mutateAsync(generateBillCmd)

    await confirmDialog.success(
      'Success',
      'Iuran berhasil digenerate ke semua user dalam sistem.',
    )

    resetForm()
    props.onSuccess(result)
  }
  catch (err: unknown) {
    const e = err as { statusCode?: number, data?: { status?: number, data?: { errors?: Record<string, string[]>, message?: string } } }
    const status = e?.statusCode ?? e?.data?.status
    const error = e?.data?.data ?? {}

    if (status === 422 && error?.errors) {
      for (const [field, messages] of Object.entries(error.errors)) {
        setFieldError(
          field as keyof GenerateBillFormData,
          Array.isArray(messages) ? messages[0] : String(messages),
        )
      }
    }
    else {
      const errorMessage = error.message || 'Gagal generate bill. Coba lagi.'
      await confirmDialog.error('Error', errorMessage)
    }

    props.onError(toError(err))
  }
})

// ✅ Tidak berubah
function handleClose() {
  if (!isSubmitting.value && !generateBillMutation.isPending.value) {
    resetForm()
    props.onClose()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !isSubmitting.value && !generateBillMutation.isPending.value) {
    handleClose()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="space-y-6">
    <form @submit="onSubmit">
      <div class="space-y-4">

        <!-- ✅ UBAH: feeId pakai ScxSelect async fetcher dari fees -->
        <CnFormField v-slot="{ componentField }" name="feeId">
          <CnFormItem class="flex flex-col">
            <CnFormLabel>
              Jenis Iuran <span class="text-primary">*</span>
            </CnFormLabel>
            <CnFormControl>
            <CnSelect v-bind="componentField" class="w-full">
            <CnSelectTrigger class="h-11 w-full">
                <CnSelectValue placeholder="- Pilih Jenis Iuran -" />
            </CnSelectTrigger>
            <CnSelectContent>
                <CnSelectItem
                v-for="fee in feeOptions"
                :key="fee.value"
                :value="fee.value"
                >
                {{ fee.label }}
                </CnSelectItem>
            </CnSelectContent>
            </CnSelect>
            </CnFormControl>
            <CnFormMessage />
          </CnFormItem>
        </CnFormField>

        <!-- ✅ TAMBAH: dueDate pakai input type date -->
        <CnFormField v-slot="{ componentField }" name="dueDate">
          <CnFormItem class="flex flex-col">
            <CnFormLabel>
              Tanggal Jatuh Tempo <span class="text-primary">*</span>
            </CnFormLabel>
            <CnFormControl>
              <CnInput
                v-bind="componentField"
                type="date"
                class="h-11 w-full"
              />
            </CnFormControl>
            <CnFormMessage />
          </CnFormItem>
        </CnFormField>

      </div>

      <!-- ✅ UBAH: disabled condition sesuai field yang bener (feeId & dueDate) -->
      <CnDialogFooter class="pt-6 flex flex-col gap-y-2 sm:flex-col">
        <CnButton
          type="submit"
          :disabled="isSubmitting || generateBillMutation.isPending.value"
          class="w-full"
        >
          <Icon
            v-if="isSubmitting || generateBillMutation.isPending.value"
            name="ph:spinner"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ (isSubmitting || generateBillMutation.isPending.value) ? 'Generating...' : 'Generate Bill' }}
        </CnButton>
        <CnButton
          type="button"
          variant="outline"
          :disabled="isSubmitting || generateBillMutation.isPending.value"
          class="text-primary border-primary w-full hover:text-primary hover:bg-primary/10"
          @click="handleClose"
        >
          Cancel
        </CnButton>
      </CnDialogFooter>
    </form>
  </div>
</template>