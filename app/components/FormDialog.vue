<script setup lang="ts">
import type { GenericObject } from 'vee-validate'
import type { ZodType } from 'zod'
import { cn } from '@/lib/utils'

// Define the form actions type
interface FormActions {
  setFieldError: (field: string, message: string) => void
  resetForm: () => void
  setFieldValue: (field: string, value: any) => void
  setValues: (values: GenericObject) => void
  values: GenericObject
}

interface FormDialogProps {
  title: string
  description: string
  buttonLabel?: string
  buttonClass?: string
  buttonDisabled?: boolean
  primaryButtonLabel?: string
  secondaryButtonLabel?: string
  primaryButtonDisabled?: boolean
  loadingText?: string
  buttonDirection?: 'horizontal' | 'vertical'
  buttonIcon?: string
  disableSubmit?: boolean
  width?: string
  height?: string
  maxWidth?: string
  validationSchema?: ZodType<Record<string, unknown>>
  initialValues?: Record<string, unknown>
  resetOnSuccess?: boolean
  closeOnSuccess?: boolean
  show?: boolean
  showCloseButton?: boolean
  onSave?: (values?: GenericObject) => Promise<boolean> | boolean
  onFormSubmit?: (values: GenericObject, actions: { resetForm: () => void, setFieldError: (field: string, message: string) => void, setFieldValue: (field: string, value: any) => void, setValues: (values: GenericObject) => void }) => Promise<boolean> | boolean
  onSecondaryClick?: () => void
  onOpen?: () => void
  onClose?: () => void
}

const props = withDefaults(defineProps<FormDialogProps>(), {
  buttonDirection: 'vertical',
  buttonDisabled: false,
  primaryButtonDisabled: false,
  disableSubmit: false,
  resetOnSuccess: true,
  closeOnSuccess: true,
  primaryButtonLabel: 'Save',
  secondaryButtonLabel: 'Cancel',
  loadingText: 'Saving...',
  showCloseButton: true,
  validationSchema: undefined,
  initialValues: () => ({}),
  onSave: undefined,
  onFormSubmit: undefined,
  onSecondaryClick: () => ({}),
  onOpen: () => ({}),
  onClose: () => ({}),
})

const emit = defineEmits<{
  'formSubmit': [values: GenericObject, actions: { resetForm: () => void, setFieldError: (field: string, message: string) => void }]
  'formSuccess': [values: GenericObject]
  'formError': [error: unknown]
  'dialogOpen': []
  'dialogClose': []
  'update:show': [value: boolean]
}>()

// Define slots with proper typing - form is optional because it's only present when validationSchema is provided
defineSlots<{
  fields: (props: { form?: FormActions }) => any
}>()

const open = ref(false)
const isSubmitting = ref(false)

const buttonContainerClass = computed(() =>
  props.buttonDirection === 'horizontal'
    ? 'flex flex-row-reverse gap-2'
    : 'flex flex-col gap-2',
)

const initialValues = computed(() => props.initialValues || {})

watch(() => props.show, (newVal) => {
  if (newVal !== undefined) {
    open.value = newVal
  }
}, { immediate: true })

watch(open, (newValue, oldValue) => {
  emit('update:show', newValue)

  if (newValue && !oldValue) {
    props.onOpen?.()
    emit('dialogOpen')
  }
  else if (!newValue && oldValue) {
    props.onClose?.()
    emit('dialogClose')
  }
})

async function handleFormSubmit(values: GenericObject, { setFieldError, resetForm, setFieldValue, setValues }: { setFieldError: (field: string, message: string) => void, resetForm: () => void, setFieldValue: (field: string, value: any) => void, setValues: (values: GenericObject) => void }) {
  if (isSubmitting.value)
    return

  isSubmitting.value = true

  try {
    emit('formSubmit', values, { resetForm, setFieldError })

    let result = true

    if (props.onFormSubmit) {
      const formActions = {
        resetForm,
        setFieldError,
        setFieldValue,
        setValues,
      }
      result = await props.onFormSubmit(values, formActions)
    }
    else if (props.onSave) {
      result = await props.onSave(values)
    }

    if (result !== false) {
      emit('formSuccess', values)

      if (props.resetOnSuccess) {
        resetForm()
      }

      if (props.closeOnSuccess) {
        open.value = false
      }
    }
  }
  catch (error) {
    console.error('Form submission error:', error)
    emit('formError', error)

    // Handle server validation errors
    if (typeof error === 'object' && error !== null) {
      const serverError = error as { status?: number, errors?: Record<string, string[]> }
      if (serverError.status === 422 && serverError.errors) {
        for (const [field, messages] of Object.entries(serverError.errors)) {
          if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
            setFieldError(field, messages[0])
          }
        }
      }
    }
  }
  finally {
    isSubmitting.value = false
  }
}

async function handleSubmit() {
  if (isSubmitting.value)
    return

  isSubmitting.value = true

  try {
    let result = true
    if (props.onSave) {
      result = await props.onSave()
    }
    if (result) {
      if (props.closeOnSuccess) {
        open.value = false
      }
    }
  }
  catch (error) {
    console.error('Submit error:', error)
    emit('formError', error)
  }
  finally {
    isSubmitting.value = false
  }
}

function handleSecondaryClick() {
  props.onSecondaryClick?.()
  open.value = false
}

function openDialog() {
  open.value = true
}

defineExpose({
  open: openDialog,
  openDialog,
  close: () => { open.value = false },
  isOpen: computed(() => open.value),
})
</script>

<template>
  <div>
    <CnButton
      v-if="buttonLabel"
      variant="outline"
      size="lg"
      :disabled="buttonDisabled"
      :class="buttonClass"
      @click="openDialog"
    >
      <Icon :name="buttonIcon || 'ph:plus'" size="20" />
      {{ buttonLabel }}
    </CnButton>
    <CnDialog v-model:open="open">
      <CnDialogContent
        class="rounded-sm flex flex-col gap-6"
        :class="[
          width || 'w-full lg:w-md',
          height || 'h-auto max-h-[90vh] overflow-y-auto',
          maxWidth || '',
          { 'hide-close-button': !showCloseButton },
        ]"
      >
        <CnDialogHeader>
          <CnDialogTitle>{{ title }}</CnDialogTitle>
          <CnDialogDescription>{{ description }}</CnDialogDescription>
        </CnDialogHeader>
        <div
          :class="cn(
            'w-full',
            height || 'h-full',
            'overflow-y-visible',
          )"
        >
          <CnForm
            v-if="validationSchema" v-slot="{ setFieldError: formSetFieldError, resetForm: formResetForm, setFieldValue: formSetFieldValue, setValues: formSetValues, values: formValues }"
            :validation-schema="validationSchema" :initial-values="initialValues" class="flex flex-grow flex-col"
            @submit="handleFormSubmit"
          >
            <div class="flex-grow space-y-6">
              <slot name="fields" :form="{ setFieldError: formSetFieldError, resetForm: formResetForm, setFieldValue: formSetFieldValue, setValues: formSetValues, values: formValues }" />
            </div>
            <div :class="buttonContainerClass" class="mt-6">
              <CnButton
                type="submit" variant="default" :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
                class="h-11" :disabled="primaryButtonDisabled || isSubmitting"
              >
                <template v-if="isSubmitting">
                  <Icon name="ph:spinner" class="mr-2 h-4 w-4 animate-spin" />
                  {{ loadingText || 'Saving...' }}
                </template>
                <template v-else>
                  {{ primaryButtonLabel || 'Save' }}
                </template>
              </CnButton>
              <CnButton
                type="button" variant="outline" :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
                class="text-primary border-primary h-11 hover:text-primary hover:bg-primary/10" @click="handleSecondaryClick"
              >
                {{ secondaryButtonLabel || 'Cancel' }}
              </CnButton>
            </div>
          </CnForm>

          <div v-else class="flex flex-grow flex-col">
            <CnForm class="flex flex-grow flex-col" @submit="handleSubmit">
              <div class="flex-grow space-y-6">
                <slot name="fields" :form="undefined" />
              </div>
              <div :class="buttonContainerClass" class="mt-6">
                <CnButton
                  type="submit" variant="default"
                  :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'" class="h-11"
                  :disabled="primaryButtonDisabled || isSubmitting || disableSubmit"
                >
                  <template v-if="isSubmitting">
                    <Icon name="ph:spinner" class="mr-2 h-4 w-4 animate-spin" />
                    {{ loadingText || 'Saving...' }}
                  </template>
                  <template v-else>
                    {{ primaryButtonLabel || 'Save' }}
                  </template>
                </CnButton>
                <CnButton
                  type="button" variant="outline"
                  :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'" class="hover:text-primary text-primary border-primary h-11 hover:bg-primary/10"
                  @click="handleSecondaryClick"
                >
                  {{ secondaryButtonLabel || 'Cancel' }}
                </CnButton>
              </div>
            </CnForm>
          </div>
        </div>
      </CnDialogContent>
    </CnDialog>
  </div>
</template>
