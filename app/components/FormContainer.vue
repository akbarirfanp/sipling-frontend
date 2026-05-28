<script setup lang="ts">
import type { GenericObject } from 'vee-validate'
import type { ZodSchema } from 'zod'

interface FormSubmitAction {
  resetForm: () => void
  setFieldError: (field: string, message: string) => void
  setFieldValue: (field: string, value: any) => void
  setValues: (values: GenericObject) => void
}

interface BaseFormProps {
  title?: string
  description?: string
  containerClass?: string
  primaryButtonLabel?: string
  secondaryButtonLabel?: string
  buttonLabel?: string
  primaryButtonDisabled?: boolean
  loadingText?: string
  buttonDirection?: 'horizontal' | 'vertical'
  disableSubmit?: boolean
  showSecondaryButton?: boolean
  validationSchema?: ZodSchema<Record<string, unknown>>
  initialValues?: Record<string, unknown>
  resetOnSuccess?: boolean
  onSecondaryClick?: () => void
}

type FormProps = BaseFormProps & (
  | { onSave?: (values?: GenericObject) => Promise<boolean> | boolean, onFormSubmit?: never }
  | { onSave?: never, onFormSubmit?: (values: GenericObject, actions: FormSubmitAction) => Promise<boolean> | boolean }
)

const props = withDefaults(defineProps<FormProps>(), {
  buttonDirection: 'vertical',
  resetOnSuccess: true,
  primaryButtonLabel: 'Save',
  secondaryButtonLabel: 'Cancel',
  loadingText: 'Saving...',
  showSecondaryButton: true,
  containerClass: 'w-full',
  validationSchema: undefined,
  initialValues: () => ({}),
  onSave: undefined,
  onFormSubmit: undefined,
  onSecondaryClick: () => ({}),
})

const emit = defineEmits<{
  formSubmit: [values: GenericObject]
  formSuccess: [values: GenericObject]
  formError: [error: unknown]
}>()

const isSubmitting = ref(false)

const buttonContainerClass = computed(() =>
  props.buttonDirection === 'horizontal'
    ? 'flex flex-row-reverse gap-2'
    : 'flex flex-col gap-2',
)

// Make initialValues reactive
const initialValues = computed(() => props.initialValues || {})

// Enhanced form submission handler with validation
async function handleFormSubmit(
  values: GenericObject,
  { setFieldError, resetForm, setFieldValue, setValues }: {
    setFieldError: (field: string, message: string) => void
    resetForm: () => void
    setFieldValue: (field: string, value: any) => void
    setValues: (values: GenericObject) => void
  },
) {
  if (isSubmitting.value)
    return

  isSubmitting.value = true

  try {
    emit('formSubmit', values)

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

// Legacy submit handler for backward compatibility
async function handleSubmit() {
  if (isSubmitting.value)
    return

  isSubmitting.value = true

  try {
    let result = true
    if (props.onSave) {
      result = await props.onSave()
    }
    if (result !== false) {
      emit('formSuccess', {})
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
}

// Expose methods for parent components
defineExpose({
  isSubmitting: computed(() => isSubmitting.value),
  submit: () => handleSubmit(),
})
</script>

<template>
  <div :class="containerClass">
    <div v-if="title || description" class="mb-6">
      <h2 v-if="title" class="text-lg font-semibold mb-2">
        {{ title }}
      </h2>
      <p v-if="description" class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div class="p-6 border rounded-lg bg-white w-full">
      <CnForm
        v-if="validationSchema"
        v-slot="{
          setFieldError: formSetFieldError,
          resetForm: formResetForm,
          setFieldValue: formSetFieldValue,
          setValues: formSetValues,
          values: formValues,
          errors: formErrors,
        }"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
        class="flex flex-grow flex-col"
        @submit="handleFormSubmit"
      >
        <div class="flex-grow space-y-6">
          <slot
            name="fields" :form="{
              setFieldError: formSetFieldError,
              resetForm: formResetForm,
              setFieldValue: formSetFieldValue,
              setValues: formSetValues,
              values: formValues || {},
              errors: formErrors || {},
            }"
          />
        </div>
        <div :class="buttonContainerClass" class="mt-6">
          <CnButton
            type="submit"
            variant="default"
            :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
            class="h-11"
            :disabled="primaryButtonDisabled || isSubmitting"
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
            v-if="showSecondaryButton"
            type="button"
            variant="outline"
            :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
            class="text-green-600 border-green-600 h-11 hover:text-primary hover:bg-primary/10"
            @click="handleSecondaryClick"
          >
            {{ secondaryButtonLabel || 'Cancel' }}
          </CnButton>
        </div>
      </CnForm>

      <div v-else class="flex flex-grow flex-col">
        <CnForm
          v-slot="{
            setFieldError: formSetFieldError,
            resetForm: formResetForm,
            setFieldValue: formSetFieldValue,
            setValues: formSetValues,
            values: formValues,
            errors: formErrors,
          }"
          class="flex flex-grow flex-col"
          @submit="handleSubmit"
        >
          <div class="flex-grow space-y-6">
            <slot
              name="fields" :form="{
                setFieldError: formSetFieldError,
                resetForm: formResetForm,
                setFieldValue: formSetFieldValue,
                setValues: formSetValues,
                values: formValues || {},
                errors: formErrors || {},
              }"
            />
          </div>
          <div :class="buttonContainerClass" class="mt-6">
            <CnButton
              type="submit"
              variant="default"
              :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
              class="h-11"
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
              v-if="showSecondaryButton"
              type="button"
              variant="outline"
              :class="buttonDirection === 'horizontal' ? 'flex-1' : 'w-full'"
              class="h-11"
              @click="handleSecondaryClick"
            >
              {{ secondaryButtonLabel || 'Cancel' }}
            </CnButton>
          </div>
        </CnForm>
      </div>
    </div>
  </div>
</template>
