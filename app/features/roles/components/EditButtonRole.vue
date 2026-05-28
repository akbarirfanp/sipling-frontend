<script setup lang="ts">
import type { GenericError } from '#imports'
import type { GenericObject } from 'vee-validate'
import type { ZodSchema } from 'zod'
import type FormDialog from '~/components/FormDialog.vue'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { useRolesQueries } from '~/features/roles/useRolesQueries'

const props = defineProps<{
  roleId: string
  roleName: string
  status?: boolean
}>()

const emit = defineEmits<{
  editSuccess: []
}>()

const rolesQuery = useRolesQueries()
const updateRoleMutation = rolesQuery.useUpdateMutation()
const confirmDialog = useConfirmDialog()
const dialogRef = ref<InstanceType<typeof FormDialog>>()

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Role name is required')
    .min(3, 'Role name must be at least 3 characters')
    .max(100, 'Role name must not exceed 100 characters')
    .refine(
      val => /^[\w\s\-]+$/.test(val),
      'Role name can only contain letters, numbers, spaces, hyphens, and underscores',
    ),
  status: z.enum(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  }),
})

type FormData = z.infer<typeof schema>

const validationSchema = computed(
  () => toTypedSchema(schema) as unknown as ZodSchema<Record<string, unknown>>,
)

const initialValues = computed<Partial<FormData>>(() => ({
  name: props.roleName?.trim() || '',
  status: props.status !== undefined ? (props.status ? 'active' : 'inactive') : 'active',
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
    if (actions?.setSubmitting) {
      actions.setSubmitting(true)
    }

    const formData = values as FormData

    const validationResult = schema.safeParse(formData)
    if (!validationResult.success) {
      if (actions?.setFieldError) {
        validationResult.error.issues.forEach((issue) => {
          if (issue.path[0] && actions.setFieldError) {
            actions.setFieldError(String(issue.path[0]), issue.message)
          }
        })
      }
      else if (actions?.setErrors) {
        const errors: Record<string, string> = {}
        validationResult.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[String(issue.path[0])] = issue.message
          }
        })
        actions.setErrors(errors)
      }
      return false
    }

    const confirmed = await confirmDialog.confirm({
      title: 'Confirm Role Update',
      message: `Are you sure you want to update the role "${formData.name}"? Please verify all information is correct.`,
      confirmText: 'Update Role',
      cancelText: 'Cancel',
      type: 'confirmation',
    })

    if (!confirmed) {
      return false
    }

    const payload = {
      name: formData.name.trim(),
      status: formData.status === 'active',
    }

    await updateRoleMutation.mutateAsync({
      id: props.roleId,
      cmd: payload,
    })
    await confirmDialog.success(
      'Success',
      `Role "${formData.name}" has been successfully updated.`,
    )

    emit('editSuccess')
    return true
  }
  catch (err: unknown) {
    console.error('Error updating role:', err)
    return handleFormError(err, actions)
  }
  finally {
    if (actions?.setSubmitting) {
      actions.setSubmitting(false)
    }
  }
}

function handleFormError(
  err: unknown,
  actions?: { setFieldError?: (field: string, message: string) => void, setErrors?: (errors: Record<string, string>) => void },
): boolean {
  if (typeof err === 'object' && err !== null) {
    const serverError = err as GenericError

    if (
      serverError.data?.status === 422
      && serverError.data?.errors
      && typeof serverError.data.errors === 'object'
    ) {
      let hasFieldErrors = false
      const errors: Record<string, string> = {}

      for (const [field, messages] of Object.entries(serverError.data.errors)) {
        if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
          const errorMessage = String(messages[0])

          if (actions?.setFieldError) {
            actions.setFieldError(field, errorMessage)
            hasFieldErrors = true
          }
          else {
            errors[field] = errorMessage
            hasFieldErrors = true
          }
        }
      }

      if (hasFieldErrors) {
        if (actions?.setErrors && Object.keys(errors).length > 0) {
          actions.setErrors(errors)
        }
        return false
      }
    }

    const errorMessage = getErrorMessage(serverError)
    confirmDialog.error('Update Failed', errorMessage)
  }
  else {
    const errorMessage = err instanceof Error
      ? err.message
      : 'An unexpected error occurred while updating the role.'

    confirmDialog.error('Update Failed', errorMessage)
  }

  return false
}

function getErrorMessage(serverError: GenericError): string {
  if (serverError.data?.message) {
    return String(serverError.data.message)
  }

  if (serverError.message) {
    return String(serverError.message)
  }

  switch (serverError.data?.status) {
    case 404:
      return 'Role not found. It may have been deleted.'
    case 403:
      return 'You do not have permission to update this role.'
    case 409:
      return 'A role with this name already exists.'
    case 500:
      return 'Server error occurred. Please try again later.'
    default:
      return 'Failed to update role. Please try again.'
  }
}

function handleEdit() {
  if (!dialogRef.value) {
    console.warn('Dialog reference not available')
    return
  }

  dialogRef.value.openDialog()
}

defineExpose({
  handleEdit,
})
</script>

<template>
  <div>
    <FormDialog
      ref="dialogRef"
      title="Edit Role"
      description="Update the role information by completing the form below. All fields are required."
      primary-button-label="Update Role"
      secondary-button-label="Cancel"
      button-direction="vertical"
      width="w-full max-w-md"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      loading-text="Updating role..."
      @form-submit="handleSave"
    >
      <template #fields>
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel class="required">
              Role Name
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <CnInput
                v-bind="componentField"
                placeholder="Enter role name (3-100 characters)"
                class="h-11"
                maxlength="100"
                autocomplete="off"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="status">
          <FormItem>
            <FormLabel class="required">
              Status
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <CnSelect v-bind="componentField" class="w-full">
                <CnSelectTrigger class="h-11 w-full">
                  <CnSelectValue placeholder="Select role status" />
                </CnSelectTrigger>
                <CnSelectContent>
                  <CnSelectItem value="active">
                    <span class="flex gap-2 items-center">
                      <span class="rounded-full bg-green-500 h-2 w-2" />
                      Active
                    </span>
                  </CnSelectItem>
                  <CnSelectItem value="inactive">
                    <span class="flex gap-2 items-center">
                      <span class="rounded-full bg-red-500 h-2 w-2" />
                      Non Active
                    </span>
                  </CnSelectItem>
                </CnSelectContent>
              </CnSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </template>
    </FormDialog>
  </div>
</template>
