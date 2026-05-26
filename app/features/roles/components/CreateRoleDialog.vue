<script setup lang="ts">
import type { CreateRoleCmd, Role } from '../domain'
import type { CreateRoleFormData } from '../forms/schemas'
import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import { createRoleSchema } from '../forms/schemas'
import { useRolesQueries } from '../useRolesQueries'

interface Props {
  onClose?: () => void
  onSuccess?: (role: Role) => void
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  onClose: () => {},
  onSuccess: () => {},
  onError: () => {},
})

// Form setup dengan vee-validate + zod
const formSchema = toTypedSchema(createRoleSchema)
const { handleSubmit, isSubmitting, resetForm, setFieldError } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    status: undefined,
  } as CreateRoleFormData,
})

const confirmDialog = useConfirmDialog()

// Roles query untuk mutation
const rolesQuery = useRolesQueries()
const createRoleMutation = rolesQuery.useCreateMutation()

// Form fields
const name = useField<string>('name')
const status = useField<string>('status')

// Handle form submission
const onSubmit = handleSubmit(async (values: CreateRoleFormData) => {
  const confirmed = await confirmDialog.confirm({
    title: 'Submit New Role?',
    message: 'Before submitting, please ensure the role you entered is correct and appropriate',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'confirmation',
  })

  if (!confirmed) {
    return false
  }

  const createRoleCmd: CreateRoleCmd = {
    name: values.name,
  } as CreateRoleCmd

  try {
    const newRole: Role = await createRoleMutation.mutateAsync(createRoleCmd)

    await confirmDialog.success(
      'Success',
      'New Role has been successfully saved\n'
      + 'in the system.',
    )

    resetForm()

    props.onSuccess(newRole)
  }
  catch (err: unknown) {
    const normalizedError = toError(err)
    const e = err as { statusCode?: number, data?: { status?: number, data?: { errors?: Record<string, string[]>, message?: string } } }

    const status = e?.statusCode ?? e?.data?.status
    const error = e?.data?.data ?? {}

    if (status === 422 && error?.errors) {
      for (const [field, messages] of Object.entries(error.errors)) {
        setFieldError(
          field as keyof CreateRoleFormData,
          Array.isArray(messages) ? messages[0] : String(messages),
        )
      }
    }
    else {
      const errorMessage
        = error.message || 'Failed to create role . Please check your connection or try again.'
      await confirmDialog.error('Error', errorMessage)
    }

    // Call error callback
    props.onError(normalizedError)
  }
})

// Handle dialog close
function handleClose() {
  if (!isSubmitting.value && !createRoleMutation.isPending.value) {
    resetForm()
    props.onClose()
  }
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !isSubmitting.value && !createRoleMutation.isPending.value) {
    handleClose()
  }
}

// Add event listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Form -->
    <form @submit="onSubmit">
      <div class="space-y-4">
        <!-- Role Name Field -->
        <CnFormField v-slot="{ componentField }" name="name">
          <CnFormItem>
            <CnFormLabel class="text-sm font-medium">
              Role Name
              <span class="text-red-500">*</span>
            </CnFormLabel>
            <CnFormControl>
              <CnInput
                v-bind="componentField"
                v-model="name.value.value"
                type="text"
                placeholder="Enter role name (e.g., Admin, Manager, User)"
                :disabled="isSubmitting || createRoleMutation.isPending.value"
                class="w-full"
                autocomplete="off"
              />
            </CnFormControl>
            <CnFormMessage />
          </CnFormItem>
        </CnFormField>

        <!-- Status Field -->
        <CnFormField v-slot="{ componentField }" name="status">
          <CnFormItem>
            <CnFormLabel>Status <span class="text-red-500">*</span></CnFormLabel>
            <CnFormControl>
              <CnSelect v-bind="componentField" class="w-full">
                <CnSelectTrigger class="h-11 w-full">
                  <CnSelectValue placeholder="- Select status -" />
                </CnSelectTrigger>
                <CnSelectContent>
                  <CnSelectItem value="active">
                    Active
                  </CnSelectItem>
                  <CnSelectItem value="inactive">
                    Non Active
                  </CnSelectItem>
                </CnSelectContent>
              </CnSelect>
            </CnFormControl>
            <CnFormMessage />
          </CnFormItem>
        </CnFormField>
      </div>

      <!-- Form Actions -->
      <CnDialogFooter class="pt-6 flex flex-col gap-y-2 sm:flex-col">
        <CnButton
          type="submit"
          :disabled="isSubmitting || createRoleMutation.isPending.value || !name.value.value?.trim() || !status.value.value?.trim()"
          class="w-full"
        >
          <Icon
            v-if="isSubmitting || createRoleMutation.isPending.value"
            name="ph:spinner"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ (isSubmitting || createRoleMutation.isPending.value) ? 'Creating...' : 'Create Role' }}
        </CnButton>
        <CnButton
          type="button"
          variant="outline"
          :disabled="isSubmitting || createRoleMutation.isPending.value"
          class="text-red-500 border-red-500 w-full hover:text-red-500 hover:bg-red-500/10"
          @click="handleClose"
        >
          Cancel
        </CnButton>
      </CnDialogFooter>
    </form>
  </div>
</template>
