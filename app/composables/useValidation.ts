// composables/useValidation.ts
import { computed } from 'vue'

export function useValidation(form?: Ref<{ password: string, passwordConfirmation: string }>) {
  const required = (fieldLabel: string) => {
    return (value: string | number | null | undefined): true | string => {
      if (value === null || value === undefined || value === '') {
        return `${fieldLabel} wajib diisi`
      }
      return true
    }
  }

  const email = (value: string): true | string => {
    if (!value)
      return true
    const regex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    return regex.test(value) || 'Please enter a valid email address'
  }

  const phone = (fieldLabel = 'Phone number') => {
    return (value: string): true | string => {
      if (!value)
        return `${fieldLabel} wajib diisi`

      const phoneOnly = value.replace(/^\+\d{2}/, '')
      if (phoneOnly.length > 15)
        return 'Nomor telepon tidak boleh lebih dari 15 digit'
      if (phoneOnly.length < 8)
        return 'Nomor telepon harus minimal 8 digit'
      if (!/^\d+$/.test(phoneOnly))
        return 'Nomor telepon hanya boleh berisi angka'

      return true
    }
  }

  const passwordRules = computed(() => {
    if (!form)
      return []
    const pwd = form.value.password || ''

    return [
      { label: 'Harus memiliki minimal 8 karakter', valid: pwd.length >= 8 },
      { label: 'Mengandung huruf besar dan kecil (A-z)', valid: /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
      { label: 'Mengandung angka (0-9)', valid: /\d/.test(pwd) },
      { label: 'Mengandung karakter khusus (#,%,_, dll)', valid: /[^A-Z0-9]/i.test(pwd) },
    ]
  })

  const isPasswordValid = computed(() => {
    if (!form)
      return true
    return passwordRules.value.every(rule => rule.valid)
  })

  const passwordMismatch = computed(() => {
    if (!form)
      return false
    return (
      form.value.password
      && form.value.passwordConfirmation
      && form.value.password !== form.value.passwordConfirmation
    )
  })

  return {
    required,
    email,
    phone,
    passwordRules,
    isPasswordValid,
    passwordMismatch,
  }
}
