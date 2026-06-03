<script setup lang="ts">
import type { GenericError } from '#imports'
import type { GenericObject } from 'vee-validate'
import type { ZodSchema } from 'zod'
import type FormDialog from '~/components/FormDialog.vue'
import type { Fee } from '~/features/fees/domain'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useFeesQueries } from '~/features/fees/useFeesQueries'
import { useBillsQuery } from '~/features/bills/useBillsQuery'
import { generateBillSchema } from '~/features/bills/forms/schema'

const emit = defineEmits<{
  generateSuccess: []
}>()

const confirmDialog = useConfirmDialog()
const dialogRef = ref<InstanceType<typeof FormDialog>>()

// ✅ fees: pakai useListQuery dari createCrudQuery
const feesQuery = useFeesQueries()
const feesListQuery = feesQuery.useListQuery()

const feeOptions = computed(() => {
  const list = (feesListQuery.data?.value as any)?.items ?? []
  return list.map((f: Fee) => ({
    value: f.id,
    label: f.name ?? '',
  }))
})

// ✅ bills: pakai useBillsQuery (bukan useBillsQueries)
const { generateBillMutation } = useBillsQuery()

const validationSchema = computed(
  () => toTypedSchema(generateBillSchema) as unknown as ZodSchema<Record<string, unknown>>,
)

const initialValues = computed(() => ({
  feeId: '',
  dueDate: '',
}))

async function handleSave(
  values: GenericObject,
  actions?: {
    resetForm?: () => void
    setFieldError?: (field: string, message: string) => void
    setSubmitting?: (isSubmitting: boolean) => void
    setErrors?: (errors: Record<string, string>) => void
  },
) {
  try {
    if (actions?.setSubmitting) actions.setSubmitting(true)

    const formData = values as { feeId: string, dueDate: string }

    const confirmed = await confirmDialog.confirm({
      title: 'Generate Tagihan?',
      message: 'Pastikan jenis iuran dan tanggal jatuh tempo sudah benar sebelum generate.',
      confirmText: 'Generate',
      cancelText: 'Cancel',
      type: 'confirmation',
    })

    if (!confirmed) return false

    await generateBillMutation.mutateAsync({
      feeId: formData.feeId,
      dueDate: formData.dueDate,
    })

    await confirmDialog.success(
      'Success',
      'Iuran berhasil digenerate ke semua user dalam sistem.',
    )

    emit('generateSuccess')
    return true
  }
  catch (err: unknown) {
    console.error('Error generating bill:', err)

    const serverError = err as GenericError
    const status = serverError?.data?.status
    const errors = serverError?.data?.errors

    if (status === 422 && errors && typeof errors === 'object') {
      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages) && messages[0] && actions?.setFieldError) {
          actions.setFieldError(field, String(messages[0]))
        }
      }
      return false
    }

    const errorMessage = serverError?.data?.message
      ?? serverError?.message
      ?? 'Gagal generate tagihan. Coba lagi.'
    confirmDialog.error('Generate Failed', String(errorMessage))
    return false
  }
  finally {
    if (actions?.setSubmitting) actions.setSubmitting(false)
  }
}

function handleGenerate() {
  if (!dialogRef.value) {
    console.warn('Dialog reference not available')
    return
  }
  dialogRef.value.openDialog()
}

defineExpose({ handleGenerate })
</script>

<template>
  <div>
    <FormDialog
      ref="dialogRef"
      title="Generate Tagihan"
      description="Pilih jenis iuran dan tanggal jatuh temxpo untuk generate tagihan ke semua user."
      primary-button-label="Generate Tagihan"
      secondary-button-label="Cancel"
      button-direction="vertical"
      width="w-full max-w-md"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      loading-text="Generating tagihan..."
      @form-submit="handleSave"
    >
      <template #fields>
        <FormField v-slot="{ componentField }" name="feeId">
          <FormItem>
            <FormLabel>
              Jenis Iuran
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
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
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="dueDate">
          <FormItem>
            <FormLabel>
              Tanggal Jatuh Tempo
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <CnInput
                v-bind="componentField"
                type="date"
                class="h-11 w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </template>
    </FormDialog>
  </div>
</template>