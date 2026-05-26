import { useLogin } from './useLogin'

export function useAuth() {
  const { clear } = useUserSession()
  const router = useRouter()
  const { login } = useLogin()

  const logout = async () => {
    try {
      // Call logout API
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Clear session
      await clear()

      // Redirect to login
      await router.push('/auth/login')
    }
    catch (error) {
      console.error('Logout error:', error)
      // Fallback: clear session and redirect anyway
      await clear()
      await router.push('/auth/login')
    }
  }

  return {
    login,
    logout,
  }
}
