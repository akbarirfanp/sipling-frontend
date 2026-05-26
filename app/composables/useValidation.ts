// composables/useValidation.ts
import { computed } from 'vue'

export function useValidation(form?: Ref<{ password: string, passwordConfirmation: string }>) {
  const required = (fieldLabel: string) => {
    return (value: string | number | null | undefined): true | string => {
      if (value === null || value === undefined || value === '') {
        return `${fieldLabel} is required`
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
        return `${fieldLabel} is required`

      const phoneOnly = value.replace(/^\+\d{2}/, '')
      if (phoneOnly.length > 15)
        return 'Phone number cannot exceed 15 digits'
      if (phoneOnly.length < 8)
        return 'Phone number must be at least 8 digits'
      if (!/^\d+$/.test(phoneOnly))
        return 'Phone number should only contain digits'

      return true
    }
  }

  const passwordRules = computed(() => {
    if (!form)
      return []
    const pwd = form.value.password || ''

    return [
      { label: 'At least 8 character', valid: pwd.length >= 8 },
      { label: 'Upper and lower case (A-z)', valid: /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
      { label: 'Number (0-9)', valid: /\d/.test(pwd) },
      { label: 'Special character (#,%,_, etc)', valid: /[^A-Z0-9]/i.test(pwd) },
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
