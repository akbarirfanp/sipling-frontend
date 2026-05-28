export function useLogin() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  const login = async (payload: { email?: string, username?: string, password: string, rememberMe?: boolean }) => {
    pending.value = true
    error.value = null
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: payload,
      })
      // Session akan di-fetch otomatis oleh middleware saat navigation
      return true
    }
    catch (e: any) {
      error.value = e?.statusMessage || 'Login failed'
      return false
    }
    finally {
      pending.value = false
    }
  }
  return { login, pending, error }
}
