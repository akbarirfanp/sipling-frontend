<script setup lang="ts">
import type { GenericObject } from 'vee-validate'
import type { z, ZodSchema } from 'zod'
import type { Role } from '~/features/roles/domain'
import { useRolesQuery } from '~/features/roles/useRolesQuery'
import { toTypedSchema } from '@vee-validate/zod'
import CreateButtonPassword from '~/features/users/components/CreateButtonPassword.vue'
import { createUserSchema } from '~/features/users/forms/schemas'
import { useUsers } from '~/features/users/useUsersQuery'

const emit = defineEmits(['createSuccess'])
const { createUser } = useUsers()
const confirmDialog = useConfirmDialog()
const router = useRouter()

const formSchema = createUserSchema
type FormData = z.infer<typeof formSchema>
type FormDataWithPassword = FormData & {
  password: string
  passwordConfirmation: string
}

const validationSchema = computed(() => toTypedSchema(formSchema) as unknown as ZodSchema<Record<string, unknown>>)

const initialValues: FormData = {
  username: '',
  name: '',
  emailAddress: '',
  address: '',
  roleId: '',
  status: '',
}

const step1Data = reactive<FormData>({ ...initialValues })
const showPasswordModal = ref(false)

async function handleSaveLogic(values: GenericObject) {
  const formData = values as FormDataWithPassword
  const confirmed = await confirmDialog.confirm({
    title: 'Anda Yakin Ingin Submit Data Ini?',
    message: 'Pastikan data pengguna yang anda input sudah benar dan sesuai.',
    confirmText: 'Ya',
    cancelText: 'Batal',
    type: 'confirmation',
  })
  if (!confirmed)
    return false
  try {
    const result = await createUser({
      name: formData.name.trim(),
      address: formData.address.trim(),
      email: formData.emailAddress.trim(),
      roleId: formData.roleId.trim(),
      password: formData.password,
      status: formData.status === '1',
    })
    await confirmDialog.success('Success', 'New user has been successfully saved in the system.')
    emit('createSuccess')
    if (confirmed && result?.id) {
      router.push(`/users/${result.id}`)
    }
    return true
  }
  catch (err) {
    let errorMessage = 'An error occurred while creating the user.'

    if (
      typeof err === 'object'
      && err !== null
      && 'data' in err
      && isApiErrorResponse((err as GenericError).data?.data)
    ) {
      const apiError = (err as GenericError).data!.data!

      if (isValidationError(apiError)) {
        errorMessage = Object.values(apiError.errors)
          .flat()
          .join('\n')
      }
      else {
        errorMessage = apiError.message
      }
    }
    else if (
      typeof err === 'object'
      && err !== null
      && 'data' in err
      && typeof (err as GenericError).data?.message === 'string'
    ) {
      errorMessage = (err as GenericError).data!.message!
    }

    await confirmDialog.error('Error', errorMessage)
  }
}

const {
  roles,
  totalPages: totalPagesRoles,
  page: pageRoles,
  pageSize: pageSizeRoles,
  search: searchRoles,
  refreshRoles: _refreshRoles,
  isLoadingRoles: _isLoadingRoles,
  rolesError: _rolesError,
} = useRolesQuery()

async function fetchRoles(query: string, cursor?: string): Promise<ScxSelectFetchResult> {
  try {
    const pageNumber = cursor ? Number.parseInt(cursor, 10) : 1
    pageRoles.value = pageNumber
    pageSizeRoles.value = 20
    searchRoles.value = query || ''

    await _refreshRoles()

    const items = roles.value.map((r: Role) => ({
      value: r.id,
      label: r.name ?? '',
    }))

    return {
      items,
      nextCursor: pageNumber < totalPagesRoles.value ? String(pageNumber + 1) : undefined,
      hasMore: pageNumber < totalPagesRoles.value,
    }
  }
  catch (error) {
    console.error('Error fetching roles:', error)
    return { items: [], hasMore: false }
  }
}

function handleNextStep(values: GenericObject): boolean {
  Object.assign(step1Data, values as FormData)
  showPasswordModal.value = true
  return false
}

async function handleFinalSave(payload: { password: string, passwordConfirmation: string, currentPassword?: string }) {
  const fullPayload = {
    ...step1Data,
    password: payload.password,
    passwordConfirmation: payload.passwordConfirmation,
  }
  await handleSaveLogic(fullPayload)
}

const handleCancel = () => router.push('/users')
</script>

<template>
  <div class="p-6">
    <CreateButtonPassword
      :show="showPasswordModal"
      @update:show="val => showPasswordModal = val"
      @save="handleFinalSave"
    />
    <FormContainer
      title="Pembuatan Pengguna Baru"
      primary-button-label="Selanjutnya"
      secondary-button-label="Batal"
      button-label="Buat Pengguna"
      button-direction="horizontal"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      loading-text="Save in progress..."
      :on-form-submit="handleNextStep"
      :reset-on-success="false"
      :on-secondary-click="handleCancel"
    >
      <template #fields>
        <!-- Row 1: Username, Name -->
        <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
          <!-- Username -->
          <CnFormField v-slot="{ componentField }" name="username">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Username <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Enter username" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
          <!-- Full Name -->
          <CnFormField v-slot="{ componentField }" name="name">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Full Name <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Enter full name" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>

        <!-- Row 2: Email, Phone Number -->
        <div class="mt-3 gap-4 grid grid-cols-1 md:grid-cols-2">
          <!-- Email - CHANGED: email_address -> emailAddress -->
          <CnFormField v-slot="{ componentField }" name="emailAddress">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Email Address <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Enter email address" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>

          <CnFormField v-slot="{ componentField }" name="roleId">
            <CnFormItem class="flex flex-col w-full">
              <CnFormLabel>Role <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <ScxSelect
                  v-bind="componentField"
                  placeholder="- Select Role -"
                  :async="true"
                  :fetcher="fetchRoles"
                  searchable
                  clearable
                />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>

        <!-- Row 3: Division and Queue -->
        <div class="gap-4 grid grid-cols-2 md:grid-cols-1">
          <!-- Division - CHANGED: division_id -> divisionId -->
          <!-- Status -->
          <CnFormField v-slot="{ componentField }" name="status">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Status <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnSelect v-bind="componentField">
                  <CnSelectTrigger class="h-11 w-full" size="default">
                    <CnSelectValue placeholder="- Select Status -" />
                  </CnSelectTrigger>
                  <CnSelectContent>
                    <CnSelectItem value="1">
                      Active
                    </CnSelectItem>
                    <CnSelectItem value="0">
                      Non Active
                    </CnSelectItem>
                  </CnSelectContent>
                </CnSelect>
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>

           <!-- Address-->
          <CnFormField v-slot="{ componentField }" name="address">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Alamat <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Ketik Alamat" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>

      </template>
    </FormContainer>
    <ConfirmDialogAlert
      :is-open="confirmDialog.isOpen"
      :options="confirmDialog.options"
      @confirm="confirmDialog.resolveConfirm(true)"
      @close="confirmDialog.closeDialog"
    />
  </div>
</template>
