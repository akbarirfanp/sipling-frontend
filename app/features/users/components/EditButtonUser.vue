<script setup lang="ts">
import type { ScxSelectFetchResult } from '#shared/types/select'
import type { GenericObject } from 'vee-validate'
import type { z, ZodSchema } from 'zod'
import type { Role } from '~/features/roles/domain'
import type { User } from '~/features/users/domain'
import { toTypedSchema } from '@vee-validate/zod'
import { onMounted } from 'vue'
import { useRolesQuery } from '~/features/roles/useRolesQuery'
import { updateUserSchema } from '~/features/users/forms/schemas'
import { useUsers } from '~/features/users/useUsers'

const props = defineProps<{
  user: User
}>()
const emit = defineEmits(['editSuccess'])
const { updateUser } = useUsers()
const confirmDialog = useConfirmDialog()
const dialogRef = ref()

const rolesQuery = useRolesQuery()

const {
  roles,
  totalPages: rolTotalPages,
  page: rolPage,
  pageSize: rolPageSize,
  search: rolSearch,
  refreshRoles: _refreshRoles,
} = rolesQuery

const rolesError = computed(() => {
  return (rolesQuery).rolesError.value ?? false
})

const isLoadingRoles = computed(() => {
  return (rolesQuery).isLoadingRoles.value ?? false
})

async function fetchRoles(query: string, cursor?: string): Promise<ScxSelectFetchResult> {
  try {
    const pageNumber = cursor ? Number.parseInt(cursor, 10) : 1

    rolPage.value = pageNumber
    rolPageSize.value = 20
    rolSearch.value = query?.trim() || ''

    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      throw new Error('Invalid page number')
    }

    await _refreshRoles()

    const items = roles.value
      .filter(rol => rol.id && rol.name)
      .map((rol: Role) => ({
        value: String(rol.id),
        label: rol.name!,
      }))

    return {
      items,
      nextCursor: pageNumber < rolTotalPages.value ? String(pageNumber + 1) : undefined,
      hasMore: pageNumber < rolTotalPages.value,
    }
  }
  catch (error) {
    console.error('Error fetching roles:', error)
    return { items: [], hasMore: false }
  }
}

// function parsePhoneToE164Format(phone?: string | null): string {
//   if (!phone)
//     return ''
//   const cleaned = phone.replace(/[()]/g, '').replace(/^\+?(\d+)/, '+$1')
//   return cleaned
// }

const formSchema = updateUserSchema
type FormData = z.infer<typeof formSchema>
const validationSchema = computed(() => toTypedSchema(formSchema) as unknown as ZodSchema<Record<string, unknown>>)

const initialValues = computed(() => {
  // const e164Phone = parsePhoneToE164Format(props.user.phoneNumber)

  return {
    username: props.user.username ?? '',
    name: props.user.name ?? '',
    emailAddress: props.user.email ?? '',
    address: props.user.address ?? '',
    // phoneNumber: e164Phone,
    roleId: props.user.roleId ?? '',
    status: props.user.status ? '1' : '0',
    countryCode: '',
  }
})

async function handleSave(values: GenericObject, _actions: { resetForm: () => void, setFieldError: (field: string, message: string) => void }) {
  const formData = values as FormData
  const confirmed = await confirmDialog.confirm({
    title: 'Anda Yakin Ingin Menyimpan Perubahan Ini?',
    message: 'Pastikan data yang dimasukkan sudah benar dan sesuai',
    confirmText: 'Ya',
    cancelText: 'Batal',
    type: 'confirmation',
  })
  if (!confirmed) {
    return false
  }
  try {
    await updateUser(props.user.id, {
      name: formData.name,
      username: formData.username,
      // phoneNumber: formData.phoneNumber,
      email: formData.emailAddress,
      roleId: formData.roleId,
      status: formData.status === '1',
    })
    confirmDialog.success(
      'Berhasil',
      'Data pengguna berhasil diperbarui',
    )
    emit('editSuccess')
    return true
  }
  catch (err) {
    let errorMessage = 'Terjadi kesalahan saat memperbarui data pengguna.'

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
        errorMessage = apiError.message || 'Terjadi kesalahan yang tidak diketahui.'
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
    return false
  }
}

function handleEdit() {
  dialogRef.value?.openDialog()
}

defineExpose({
  handleEdit,
})

onMounted(async () => {
  if (props.user.roleId && !props.user.roleName) {
    try {
      await fetchRoles('', '1')
    }
    catch (error) {
      console.warn('Failed to pre-load roles:', error)
    }
  }
})
</script>

<template>
  <div>
    <FormDialog
      ref="dialogRef"
      title="Edit Pengguna"
      description="Ubah data dengan mengisi form di bawah ini."
      primary-button-label="Simpan"
      secondary-button-label="Batal"
      button-direction="vertical"
      width="w-full max-w-md"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      loading-text="Save in progress..."
      @form-submit="handleSave"
      @form-success="handleEdit"
    >
      <template #fields>
        <div class="gap-4 grid grid-cols-2">
          <CnFormField v-slot="{ componentField }" name="username">
            <CnFormItem class="min-h-[80px] w-full">
              <CnFormLabel>Username</CnFormLabel>
              <CnFormControl>
                <CnInput
                  v-bind="componentField"
                  placeholder="Masukkan username"
                  class="h-11"
                />
              </CnFormControl>
              <CnFormMessage />
            </CnFormItem>
          </CnFormField>

          <CnFormField v-slot="{ componentField }" name="name">
            <CnFormItem>
              <CnFormLabel>Nama Lengkap</CnFormLabel>
              <CnFormControl>
                <CnInput
                  v-bind="componentField"
                  placeholder="Masukkan nama lengkap"
                  class="h-11"
                />
              </CnFormControl>
              <CnFormMessage />
            </CnFormItem>
          </CnFormField>

          <CnFormField v-slot="{ componentField }" name="emailAddress">
            <CnFormItem>
              <CnFormLabel>Email</CnFormLabel>
              <CnFormControl>
                <CnInput
                  v-bind="componentField"
                  placeholder="Masukkan email"
                  class="h-11"
                />
              </CnFormControl>
              <CnFormMessage />
            </CnFormItem>
          </CnFormField>

          <!-- Phone number field -->

          <!-- Status -->
          <CnFormField v-slot="{ componentField }" name="status">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Status</CnFormLabel>
              <CnFormControl>
                <CnSelect v-bind="componentField">
                  <CnSelectTrigger class="h-11 w-full" size="default">
                    <CnSelectValue placeholder="- Pilih Status -" />
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

        <div class="gap-4 grid grid-cols-1">
        <!-- Searchable Select Role -->
          <CnFormField v-slot="{ componentField }" name="roleId">
            <CnFormItem class="flex flex-col w-full">
              <CnFormLabel>Role</CnFormLabel>
              <CnFormControl>
                <ScxSelect
                  v-bind="componentField"
                  placeholder="- Pilih Role -"
                  :async="true"
                  :fetcher="fetchRoles"
                  :loading="isLoadingRoles"
                  searchable
                  clearable
                  :error="rolesError"
                  :default-items="user.roleId
                    ? [{
                      value: user.roleId ?? '',
                      label: user.roleName ?? '',
                    }] : []"
                />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>
        <div class="gap-4 grid grid-cols-1">
          <CnFormField v-slot="{ componentField }" name="address">
            <CnFormItem class="flex flex-col">
              <CnFormLabel>Alamat <span class="text-red-500">*</span></CnFormLabel>
              <CnFormControl>
                <CnInput v-bind="componentField" placeholder="Ketik Alamat" class="h-11 w-full" />
              </CnFormControl>
              <CnFormMessage class="text-sm text-red-500 min-h-[20px]" />
            </CnFormItem>
          </CnFormField>
        </div>
      </template>
    </FormDialog>
  </div>
</template>
