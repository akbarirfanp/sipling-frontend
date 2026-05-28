import type { GenericObject } from 'vee-validate'
import { ref } from 'vue'

interface UseFormContainerOptions {
  onSave?: (values?: GenericObject) => Promise<boolean> | boolean
  onFormSubmit?: (
    values: GenericObject,
    actions: { resetForm: () => void, setFieldError: (field: string, message: string) => void }
  ) => Promise<boolean> | boolean
  resetOnSuccess?: boolean
}

interface FormSubmitResult {
  success: boolean
  values?: GenericObject
  error?: unknown
}

interface SubmitResult {
  success: boolean
  error?: unknown
}

export function useFormContainer(options: UseFormContainerOptions = {}) {
  const { resetOnSuccess = true } = options
  const isSubmitting = ref(false)

  async function handleFormSubmit(
    values: GenericObject,
    { setFieldError, resetForm }: {
      setFieldError: (field: string, message: string) => void
      resetForm: () => void
    },
  ): Promise<FormSubmitResult> {
    if (isSubmitting.value)
      return { success: false }

    isSubmitting.value = true

    try {
      let result = true

      if (options.onFormSubmit) {
        result = await options.onFormSubmit(values, { resetForm, setFieldError })
      }
      else if (options.onSave) {
        result = await options.onSave(values)
      }

      if (result && resetOnSuccess) {
        resetForm()
      }

      return { success: result, values }
    }
    catch (error) {
      console.error('Form submission error:', error)

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

      return { success: false, error }
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function handleSubmit(): Promise<SubmitResult> {
    if (isSubmitting.value)
      return { success: false }

    isSubmitting.value = true

    try {
      let result = true
      if (options.onSave) {
        result = await options.onSave()
      }
      return { success: result }
    }
    catch (error) {
      console.error('Submit error:', error)
      return { success: false, error }
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    handleFormSubmit,
    handleSubmit,
  }
}
