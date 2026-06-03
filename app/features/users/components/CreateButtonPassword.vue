<script setup lang="ts">
import CreateNewDialog from '~/components/FormDialog.vue'

interface Props {
  show: boolean
  mode?: 'create' | 'change'
  title?: string
  description?: string
  primaryButtonLabel?: string
  requireConfirm?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  title: '',
  description: '',
  primaryButtonLabel: '',
  requireConfirm: true,
})

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'save', payload: { password: string, passwordConfirmation: string, currentPassword?: string }): void
}>()

const localShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
})

const dialogTitle = computed(() =>
  props.title || (props.mode === 'change' ? 'Simpan' : 'Simpan'),
)
const dialogDescription = computed(() =>
  props.description
  || (props.mode === 'change'
    ? 'Ubah password untuk menjaga keamanan akun.'
    : 'Atur password untuk pengguna baru.'),
)
const primaryButtonLabel = computed(() =>
  props.primaryButtonLabel || (props.mode === 'change' ? 'Simpan' : 'Selesai'),
)

const form = reactive({
  password: '',
  passwordConfirmation: '',
  currentPassword: '',
})

const currentPasswordError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { passwordRules, passwordMismatch, isPasswordValid } = useValidation(ref(form))

const isSaveDisabled = computed(() => {
  if (!isPasswordValid.value)
    return true
  if (!form.passwordConfirmation || passwordMismatch.value)
    return true
  return false
})

const handleUpdateShow = (val: boolean) => emit('update:show', val)

async function handleSave() {
  currentPasswordError.value = ''

  const payload = {
    password: form.password,
    passwordConfirmation: form.passwordConfirmation,
    ...(props.mode === 'change' && { currentPassword: form.currentPassword }),
  }

  emit('save', payload)
  emit('update:show', false)

  return true
}
</script>

<template>
  <div>
    <CreateNewDialog
      :title="dialogTitle"
      :description="dialogDescription"
      :primary-button-label="primaryButtonLabel"
      secondary-button-label="Batal"
      width="w-full max-w-md"
      :on-save="handleSave"
      :show="localShow"
      :hide-trigger="true"
      :primary-button-disabled="isSaveDisabled"
      @update:show="handleUpdateShow"
    >
      <template #fields>
        <div class="space-y-2">
          <CnLabel for="password">
            {{ mode === 'change' ? 'Password Baru' : 'Password' }}
          </CnLabel>
          <div class="relative">
            <CnInput
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="mode === 'change' ? 'Masukkan password baru' : 'Masukkan password'"
              class="pr-14 h-11"
              :class="{ 'border-red-500': form.password && !passwordRules.every(r => r.valid) }"
            />

            <Icon
              v-if="form.password && !passwordRules.every(r => r.valid)"
              name="ph:warning-circle"
              class="text-red-500 h-5 w-5 right-10 top-1/2 absolute -translate-y-1/2"
            />

            <button
              type="button"
              class="p-1 right-2 top-1/2 absolute -translate-y-1/2"
              @click="showPassword = !showPassword"
            >
              <Icon
                :name="showPassword ? 'ph:eye-slash' : 'ph:eye'"
                class="text-gray-500 h-5 w-5"
              />
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <CnLabel for="passwordConfirmation">
            {{ mode === 'change' ? 'Konfirmasi Password Baru' : 'Konfirmasi Password' }}
          </CnLabel>
          <div class="relative">
            <CnInput
              id="passwordConfirmation"
              v-model="form.passwordConfirmation"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="mode === 'change' ? 'Konfirmasi password' : 'Konfirmasi password'"
              class="pr-14 h-11"
              :class="{ 'border-red-500': passwordMismatch }"
            />

            <Icon
              v-if="passwordMismatch"
              name="ph:warning-circle"
              class="text-red-500 h-5 w-5 right-10 top-1/2 absolute -translate-y-1/2"
            />

            <button
              type="button"
              class="p-1 right-2 top-1/2 absolute -translate-y-1/2"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <Icon
                :name="showConfirmPassword ? 'ph:eye-slash' : 'ph:eye'"
                class="text-gray-500 h-5 w-5"
              />
            </button>
          </div>

          <p v-if="passwordMismatch" class="text-sm text-red-500">
            Password tidak cocok
          </p>
        </div>

        <div class="text-sm mt-4">
          <p class="font-medium">
            Password harus memenuhi syarat berikut:
          </p>
          <ul class="ml-1 mt-2 space-y-1">
            <li v-for="rule in passwordRules" :key="rule.label" class="flex gap-2 items-center">
              <Icon
                :name="rule.valid ? 'ph:check' : 'ph:x'"
                :class="rule.valid ? 'text-green-600' : 'text-red-500'"
                size="16"
              />
              <span :class="rule.valid ? 'text-green-600' : 'text-gray-400'">
                {{ rule.label }}
              </span>
            </li>
          </ul>
        </div>
      </template>
    </CreateNewDialog>
  </div>
</template>
