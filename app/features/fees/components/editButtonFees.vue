<script setup lang="ts">
import type { GenericError } from '#imports'
import type { GenericObject } from 'vee-validate'
import type { z, ZodSchema } from 'zod'
import { FormDialog } from '#components'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'

import Input from '~/components/ui/input/Input.vue'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { updateFeeSchema } from '~/features/fees/forms/schema'
import { useFee } from '~/features/fees/useFees'
import { useFeesQuery } from '../useFeesQuery'

const props = defineProps<{
  feeId: string
  feeName?: string
}>()

const emit = defineEmits(['editSuccess'])
const { updateFee } = useFee()
const { useFeeQuery } = useFeesQuery()
const confirmDialog = useConfirmDialog()
const dialogRef = ref()

const feeQuery = useFeeQuery(props.feeId)

const schema = updateFeeSchema

type FormData = z.infer<typeof schema>

const validationSchema = computed(() => toTypedSchema(schema) as unknown as ZodSchema<Record<string, unknown>>)

const initialValues = computed(() => {
  const fee = feeQuery.data.value

  return {
    name: fee?.name || '',
    period: fee?.period || '',
    amount: fee?.amount || '',
    description: fee?.description || '',
  }
})

async function handleSaveLogic(
  values: GenericObject,
  actions: {
    resetForm: () => void
    setFieldError: (field: string, message: string) => void
  },
) {
  const formData = values as FormData
  const confirmed = await confirmDialog.confirm({
    title: 'Submit Edit Iuran?',
    message: 'Before submitting, please ensure the fee details you entered are correct and appropriate.',
    confirmText: 'Submit',
    cancelText: 'Cancel',
    type: 'confirmation',
  })

  if (!confirmed)
    return false

  try {
    await updateFee(props.feeId, {
      name: formData.name.trim(),
      period: formData.period?.trim(),
      amount: formData.amount ?? 0,
      description: formData.description?.trim(),
    })

    await confirmDialog.success('Success', 'Iuran has been successfully updated in the system.')
    emit('editSuccess')
    return true
  }
  catch (err: unknown) {
    if (typeof err === 'object' && err !== null) {
      const serverError = err as GenericError
      if (serverError.data?.status === 422 && serverError.data?.errors && typeof serverError.data.errors === 'object') {
        for (const [field, messages] of Object.entries(serverError.data.errors)) {
          if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
            actions.setFieldError(field, messages[0])
          }
        }
        return false
      }
      let errorMessage = 'Failed to update iuran. Please check your connection or try again.'
      if (serverError.data?.message) {
        errorMessage = serverError.data.message
      }
      else if (typeof serverError.message === 'string') {
        errorMessage = serverError.message
      }
      else if (serverError.statusMessage) {
        errorMessage = `${serverError.statusCode || 'Error'}: ${serverError.statusMessage}`
      }
      if (serverError.statusCode === 502) {
        errorMessage = `Service Unavailable: The fee service is currently not responding. Please try again later or contact support.`
      }
      await confirmDialog.error('Error', errorMessage)
    }
    else {
      const errorMessage = err instanceof Error
        ? err.message
        : 'An error occurred while updating the iuran.'
      await confirmDialog.error('Error', errorMessage)
    }
    return false
  }
}

function handleEdit() {
  dialogRef.value?.openDialog()
}
console.log(feeQuery.data.value?.period)
defineExpose({
  handleEdit,
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="feeQuery.isPending.value" class="p-8 flex items-center justify-center">
      <div class="text-center">
        <div class="mx-auto mb-2 border-b-2 border-primary rounded-full h-8 w-8 animate-spin" />
        <p class="text-sm text-muted-foreground">
          Loading fee data...
        </p>
      </div>
    </div>

    <FormDialog
      v-else
      ref="dialogRef"
      title="Edit Iuran"
      description="Update fee details using the form below."
      primary-button-label="Save"
      secondary-button-label="Cancel"
      button-direction="vertical"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      loading-text="Save in progress..."
      :on-form-submit="handleSaveLogic"
      max-width="max-w-3xl"
      width="w-3xl"
    >
      <template #fields>
        <div class="space-y-6">
          <CnCard class="p-6">
            <h3 class="text-base font-semibold mb-4">
              Informasi Iuran
            </h3>

            <div class="space-y-4">
              <!-- Row 1: Nama Iuran & Period -->
              <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                <!-- Nama Iuran -->
                <CnFormField v-slot="{ componentField }" name="name">
                  <CnFormItem>
                    <CnFormLabel class="text-sm font-medium">
                      Nama Iuran <span class="text-red-500">*</span>
                    </CnFormLabel>
                    <CnFormControl>
                      <Input v-bind="componentField" placeholder="Nama Iuran" class="mt-1 h-11" />
                    </CnFormControl>
                    <CnFormMessage class="text-xs" />
                  </CnFormItem>
                </CnFormField>

                <!-- Period -->
                <CnFormField v-slot="{ componentField }" name="period">
                  <CnFormItem>
                    <CnFormLabel class="text-sm font-medium">
                      Period <span class="text-red-500">*</span>
                    </CnFormLabel>
                    <CnFormControl>
                      <CnSelect v-bind="componentField">
                        <CnSelectTrigger class="mt-1 h-11 w-full">
                          <CnSelectValue placeholder="Pilih Period" />
                        </CnSelectTrigger>
                        <CnSelectContent>
                          <CnSelectItem value="Bulanan">
                            Bulanan
                          </CnSelectItem>
                          <CnSelectItem value="Tahunan">
                            Tahunan
                          </CnSelectItem>
                        </CnSelectContent>
                      </CnSelect>
                    </CnFormControl>
                    <CnFormMessage class="text-xs" />
                  </CnFormItem>
                </CnFormField>
              </div>

              <!-- Row 2: Amount -->
              <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                <CnFormField v-slot="{ componentField }" name="amount">
                  <CnFormItem>
                    <CnFormLabel class="text-sm font-medium">
                      Nominal <span class="text-red-500">*</span>
                    </CnFormLabel>
                    <CnFormControl>
                      <Input v-bind="componentField" placeholder="0" type="number" class="mt-1 h-11" />
                    </CnFormControl>
                    <CnFormMessage class="text-xs" />
                  </CnFormItem>
                </CnFormField>
              </div>

              <!-- Row 3: Description (full width) -->
                <CnFormField v-slot="{ componentField }" name="description">
                  <CnFormItem>
                    <CnFormLabel class="text-sm font-medium">
                      Description <span class="text-red-500">*</span>
                    </CnFormLabel>
                    <CnFormControl>
                      <Input v-bind="componentField" placeholder="Description" class="mt-1 h-11" />
                    </CnFormControl>
                    <CnFormMessage class="text-xs" />
                  </CnFormItem>
                </CnFormField>
            </div>
          </CnCard>
        </div>
      </template>
    </FormDialog>

    <ConfirmDialogAlert
      :is-open="confirmDialog.isOpen"
      :options="confirmDialog.options"
      @confirm="confirmDialog.resolveConfirm(true)"
      @close="confirmDialog.closeDialog"
    />
  </div>
</template> 