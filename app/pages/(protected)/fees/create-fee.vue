<script setup lang="ts">
import type { z } from 'zod'
import type { CreateFeeCmd } from '~/features/fees/domain'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { reactive, ref } from 'vue'

import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useGlobalDialog } from '~/composables/useDialog'
import { createFeeSchema } from '~/features/fees/forms/schema'
import { useFee } from '~/features/fees/useFees'

const emit = defineEmits(['createSuccess'])
const { createFee } = useFee()
const confirmDialog = useConfirmDialog()
const dialog = useGlobalDialog()
const router = useRouter()
const schema = createFeeSchema

type FormData = z.infer<typeof schema>

const validationSchema = toTypedSchema(schema)

const initialValues: FormData = {
  name: '',
  amount: 0,
  period: 'Tahunan',
  description: '',
}

const { handleSubmit, setFieldValue, setFieldError } = useForm({
  validationSchema,
  initialValues,
})

const isSubmitting = ref(false)

const onSubmit = handleSubmit(async (values) => {
  const formData = values as FormData

  const confirmed = await confirmDialog.confirm({
    title: 'Anda Yakin Ingin Submit Data Ini?',
    message: 'Pastikan data iuran yang anda input sudah benar dan sesuai.',
    confirmText: 'Ya',
    cancelText: 'Batal',
    type: 'confirmation',
  })
  if (!confirmed)
    return

  isSubmitting.value = true

  try {
    const cmd: CreateFeeCmd = {
      name: formData.name.trim(),
      amount: formData.amount ?? 0,
      description: formData.description?.trim() ?? null,
      period: formData.period.trim(),
    }

    if (formData.name?.trim()) {
      cmd.name = formData.name.trim()
    }

    if (formData.amount) {
      cmd.amount = formData.amount // ← hapus replace
    }

    if (formData.description?.trim()) {
      cmd.description = formData.description.trim()
    }

    if (formData.period.trim()) {
        cmd.period = formData.period.trim()
    }

    const result = await createFee(cmd)

    await confirmDialog.success('Sukses', 'Iuran berhasil dibuat.')

    if (result?.id) {
      router.push(`/fees/${result.id}`)
    }

    emit('createSuccess')
    dialog.close()
  }
  catch (err: any) {
    const status = err?.statusCode ?? err?.data?.status
    const error = (err?.data?.data ?? {}) as ApiErrorResponse
    if (status === 422 && error?.errors) {
      const fieldMap: Record<string, keyof FormData> = {
        name: 'name',
        amount: 'amount',
        description: 'description',
        period: 'period',
      }

      for (const [field, messages] of Object.entries(error.errors)) {
        const formField = fieldMap[field]
        if (formField) {
          const errorMessage = (Array.isArray(messages) ? messages[0] : String(messages)) ?? ''
          setFieldError(formField, errorMessage)
        }
      }
    }
    else {
      const errorMessage
        = error.message || 'Gagal membuat iuran. Mohon periksa jaringan atau coba lagi.'
      await confirmDialog.error('Error', errorMessage)
    }
  }
  finally {
    isSubmitting.value = false
  }
})

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const raw = input.value.replace(/\./g, '').replace(/\D/g, '')
  setFieldValue('amount', raw, false) // false = skip validasi tiap ketik
  input.value = raw ? Number(raw).toLocaleString('id-ID') : ''
}

const handleCancel = () => dialog.close()

</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-semibold mb-6">
      Pembuatan Iuran Baru
    </h2>

    <form @submit="onSubmit">
      <!-- Fee Information Section -->
      <CnCard class="mb-6 p-6">
        <h3 class="text-base font-semibold mb-6">
          Informasi Iuran
        </h3>

        <div class="gap-6 grid grid-cols-1 md:grid-cols-3">
          <CnFormField v-slot="{ componentField }" name="name">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Nama Iuran<span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Masukkan nama iuran" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>

          <!-- Period dropdown -->
          <CnFormField v-slot="{ componentField }" name="period">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Period<span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnSelect v-bind="componentField">
                  <CnSelectTrigger class="h-11 w-full">
                    <CnSelectValue placeholder="Pilih period" />
                  </CnSelectTrigger>
                  <CnSelectContent>
                    <CnSelectItem value="Tahunan">Tahunan</CnSelectItem>
                    <CnSelectItem value="Bulanan">Bulanan</CnSelectItem>
                  </CnSelectContent>
                </CnSelect>
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>

          <!-- Nominal dengan auto-format -->
          <CnFormField name="amount">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Nominal<span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                  <CnInput
                    placeholder="0"
                    class="h-11 w-full pl-9"
                    inputmode="numeric"
                    @input="handleAmountInput"
                  />
                </div>
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>

        <div class="gap-6 mt-6 grid grid-cols-1 md:grid-cols-1">
          <CnFormField v-slot="{ componentField }" name="description">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Deskripsi</CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Masukkan deskripsi" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>  
        </div>
      </CnCard>

      <div class="flex gap-3">
        <CnButton type="button" variant="outline" :disabled="isSubmitting" class="text-primary border-primary flex-1 h-11 hover:text-primary hover:border-primary hover:bg-primary/10" @click="handleCancel">
          Batal
        </CnButton>
        <CnButton type="submit" :disabled="isSubmitting" class="bg-primary flex-1 h-11 hover:bg-primary/80">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
        </CnButton>
      </div>
    </form>

    <ConfirmDialogAlert
      :is-open="confirmDialog.isOpen"
      :options="confirmDialog.options"
      @confirm="confirmDialog.resolveConfirm(true)"
      @close="confirmDialog.closeDialog"
    />
  </div>
</template>
