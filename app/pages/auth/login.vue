<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { useLogin } from '@/features/auth/app/useLogin'

definePageMeta({
  layout: false,
  auth: false,
})

const { login, pending: isLoading } = useLogin()

// Redirect logic handled by guest.global.ts middleware

// Schema form
const loginSchema = z.object({
  email: z.email('Email tidak valid').min(1, 'Email wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter').min(1, 'Password wajib diisi'),
  rememberMe: z.boolean().optional(),
})

const { handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { email: '', password: '', rememberMe: false },
})

const [email] = defineField('email')
const [password] = defineField('password')
const [rememberMe] = defineField('rememberMe')

const error = ref('')

// Check for error from callback
onMounted(() => {
  const route = useRoute()
  if (route.query.error) {
    error.value = decodeURIComponent(route.query.error as string)
  }
})

const onSubmit = handleSubmit(async (values) => {
  error.value = ''

  // ⛳️ PENTING: upstream lu minta `email_address` (snake_case),
  // jadi kita kirim sesuai: server login kita forward as-is ke upstream.
  const ok = await login({
    email: values.email,
    password: values.password,
    rememberMe: values.rememberMe ?? false, // dipakai buat maxAge session kalau lu aktifkan di server
  })

  if (!ok) {
    error.value = 'Login gagal. Coba cek email/password.'
    return
  }

  // Session akan di-update otomatis oleh middleware saat navigation
  await navigateTo('/dashboard')
})

const showPassword = ref(false)

function toggleShow() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="p-4 bg-white flex min-h-screen items-center justify-center bg-gradient-to-br">
    <CnCard class="border-0 max-w-xl w-full shadow-none">
      <CnCardContent class="p-8">
        <div class="mb-8 text-center">
          <NuxtImg src="/logo.png" alt="Solutifcx" class="mx-auto w-[200px] object-contain object-left" />
          <h1 class="text-4xl font-semibold my-1">
            Sign in to your Organization {{ '\n' }}Workspace
          </h1>
        </div>

        <div class="mx-auto max-w-[430px]">
          <form class="space-y-6" @submit.prevent="onSubmit">
            <CnFormField name="email">
              <CnFormItem>
                <CnFormLabel>Email</CnFormLabel>
                <CnFormControl>
                  <CnInput
                    v-model="email"
                    type="email"
                    placeholder="you@gmail.com"
                    :disabled="isLoading"
                    required
                    class="h-11"
                  />
                </CnFormControl>
                <CnFormMessage />
              </CnFormItem>
            </CnFormField>

            <CnFormField name="password">
              <CnFormItem>
                <CnFormLabel>Password</CnFormLabel>
                <CnFormControl>
                  <div class="relative">
                    <CnInput
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Enter your password"
                      :disabled="isLoading"
                      required
                      class="pr-10 h-11"
                    />
                    <button
                      type="button"
                      :disabled="isLoading"
                      class="my-3 px-3 h-0 right-0 top-0 absolute"
                      @click="toggleShow"
                    >
                      <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
                    </button>
                  </div>
                </CnFormControl>
                <CnFormMessage />
              </CnFormItem>
            </CnFormField>

            <div class="flex items-center justify-between">
              <CnFormField name="rememberMe">
                <CnFormItem class="flex gap-2 items-center space-x-2">
                  <CnFormControl>
                    <CnCheckbox
                      id="remember"
                      v-model="rememberMe"
                    />
                  </CnFormControl>
                  <CnFormLabel for="remember" class="text-sm font-normal">
                    Remember me
                  </CnFormLabel>
                </CnFormItem>
              </CnFormField>
              <!-- <a href="#" class="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a> -->
            </div>

            <CnButton type="submit" class="h-11 w-full" :disabled="isLoading">
              <Icon v-if="isLoading" name="ph:spinner" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else name="ph:sign-in" class="mr-2 h-4 w-4" />
              Sign In
            </CnButton>

            <CnAlert v-if="error" variant="destructive">
              <Icon name="ph:warning-circle" class="h-4 w-4" />
              <CnAlertTitle>Error</CnAlertTitle>
              <CnAlertDescription>
                {{ error }}
              </CnAlertDescription>
            </CnAlert>
          </form>

          <!-- SSO Divider -->
          <div class="my-6 relative">
            <div class="flex items-center inset-0 absolute">
              <span class="border-t w-full" />
            </div>
            <div class="text-xs flex uppercase justify-center relative">
              <span class="text-muted-foreground px-2 bg-white">Or continue with</span>
            </div>
          </div>

          <!-- Genesys SSO Button -->
        </div>
      </CnCardContent>
    </CnCard>
  </div>
</template>
