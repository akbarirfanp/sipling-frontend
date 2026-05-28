import type { Component } from 'vue'
import type { ExternalToast } from 'vue-sonner'
import { markRaw } from 'vue'
import { toast } from 'vue-sonner'

/**
 * Toast types untuk berbagai skenario
 */
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

/**
 * Options untuk toast dengan berbagai konfigurasi
 */
export interface ToastOptions extends ExternalToast {
  type?: ToastType
  title?: string
  description?: string
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  dismissible?: boolean
  closeButton?: boolean
  richColors?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  onDismiss?: () => void
  onAutoClose?: () => void
}

/**
 * Promise toast options
 */
export interface PromiseToastOptions<T = any> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: any) => string)
  description?: string
  duration?: number
  finally?: () => void
}

/**
 * Custom component toast options
 */
export interface CustomToastOptions extends Omit<ToastOptions, 'title' | 'description'> {
  component: Component
  props?: Record<string, any>
}

/**
 * Composable untuk toast notifications yang lengkap
 * Mendukung semua fitur vue-sonner dengan API yang user-friendly
 */
export function useToast() {
  /**
   * Toast dasar dengan berbagai tipe
   */
  const show = (message: string, options?: ToastOptions) => {
    const { type = 'default', ...restOptions } = options || {}

    switch (type) {
      case 'success':
        return toast.success(message, restOptions)
      case 'error':
        return toast.error(message, restOptions)
      case 'warning':
        return toast.warning?.(message, restOptions) || toast(message, { ...restOptions, style: { background: '#f59e0b', color: 'white' } })
      case 'info':
        return toast.info?.(message, restOptions) || toast(message, { ...restOptions, style: { background: '#3b82f6', color: 'white' } })
      case 'loading':
        return toast.loading?.(message, restOptions) || toast(message, { ...restOptions, duration: Infinity })
      default:
        return toast(message, restOptions)
    }
  }

  /**
   * Success toast - untuk operasi yang berhasil
   */
  const success = (message: string, options?: Omit<ToastOptions, 'type'>) => {
    return toast.success(message, options)
  }

  /**
   * Error toast - untuk error handling
   */
  const error = (message: string, options?: Omit<ToastOptions, 'type'>) => {
    return toast.error(message, options)
  }

  /**
   * Warning toast - untuk peringatan
   */
  const warning = (message: string, options?: Omit<ToastOptions, 'type'>) => {
    return toast.warning?.(message, options) || toast(message, {
      ...options,
      style: { background: '#f59e0b', color: 'white' },
    })
  }

  /**
   * Info toast - untuk informasi
   */
  const info = (message: string, options?: Omit<ToastOptions, 'type'>) => {
    return toast.info?.(message, options) || toast(message, {
      ...options,
      style: { background: '#3b82f6', color: 'white' },
    })
  }

  /**
   * Loading toast - untuk operasi yang sedang berjalan
   */
  const loading = (message: string, options?: Omit<ToastOptions, 'type'>) => {
    return toast.loading?.(message, options) || toast(message, {
      ...options,
      duration: Infinity,
    })
  }

  /**
   * Promise toast - untuk async operations
   * Otomatis update dari loading ke success/error
   */
  const promise = <T = any>(
    promiseOrFunction: Promise<T> | (() => Promise<T>),
    options: PromiseToastOptions<T>,
  ) => {
    const { loading: loadingMsg, success: successMsg, error: errorMsg, finally: finallyFn, ...restOptions } = options

    const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction

    return toast.promise(promise, {
      loading: loadingMsg,
      success: successMsg,
      error: errorMsg,
      finally: finallyFn,
      ...restOptions,
    })
  }

  /**
   * Custom component toast
   */
  const custom = (options: CustomToastOptions) => {
    const { component, props, ...restOptions } = options
    return toast.custom(markRaw(component), {
      componentProps: props,
      ...restOptions,
    })
  }

  /**
   * Dismiss toast by ID
   */
  const dismiss = (toastId?: string | number) => {
    return toast.dismiss(toastId)
  }

  /**
   * Dismiss all toasts
   */
  const dismissAll = () => {
    return toast.dismiss()
  }

  /**
   * Utility methods untuk skenario umum
   */
  const utils = {
    /**
     * Toast untuk API success response
     */
    apiSuccess: (message = 'Operasi berhasil!', options?: Omit<ToastOptions, 'type'>) => {
      return success(message, {
        duration: 3000,
        ...options,
      })
    },

    /**
     * Toast untuk API error response
     */
    apiError: (error: any, fallbackMessage = 'Terjadi kesalahan!', options?: Omit<ToastOptions, 'type'>) => {
      const message = error?.response?.data?.message || error?.message || fallbackMessage
      return toast.error(message, {
        duration: 5000,
        ...options,
      })
    },

    /**
     * Toast untuk form validation error
     */
    validationError: (message = 'Periksa kembali data yang diisi!', options?: Omit<ToastOptions, 'type'>) => {
      return warning(message, {
        duration: 4000,
        ...options,
      })
    },

    /**
     * Toast untuk unauthorized access
     */
    unauthorized: (message = 'Anda tidak memiliki akses untuk melakukan operasi ini!', options?: Omit<ToastOptions, 'type'>) => {
      return error(message, {
        duration: 5000,
        ...options,
      })
    },

    /**
     * Toast untuk network error
     */
    networkError: (message = 'Koneksi bermasalah, coba lagi nanti!', options?: Omit<ToastOptions, 'type'>) => {
      return error(message, {
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
        ...options,
      })
    },

    /**
     * Toast untuk copy to clipboard
     */
    copied: (message = 'Berhasil disalin!', options?: Omit<ToastOptions, 'type'>) => {
      return success(message, {
        duration: 2000,
        ...options,
      })
    },

    /**
     * Toast untuk save/update operations
     */
    saved: (message = 'Data berhasil disimpan!', options?: Omit<ToastOptions, 'type'>) => {
      return success(message, {
        duration: 3000,
        ...options,
      })
    },

    /**
     * Toast untuk delete operations
     */
    deleted: (message = 'Data berhasil dihapus!', options?: Omit<ToastOptions, 'type'>) => {
      return success(message, {
        duration: 3000,
        ...options,
      })
    },

    /**
     * Toast untuk confirmation dengan action
     */
    confirm: (message: string, onConfirm: () => void, options?: Omit<ToastOptions, 'type' | 'action'>) => {
      return show(message, {
        duration: 10000,
        action: {
          label: 'Konfirmasi',
          onClick: onConfirm,
        },
        cancel: {
          label: 'Batal',
        },
        ...options,
      })
    },

    /**
     * Toast untuk undo operations
     */
    undo: (message: string, onUndo: () => void, options?: Omit<ToastOptions, 'type' | 'action'>) => {
      return show(message, {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: onUndo,
        },
        ...options,
      })
    },
  }

  return {
    // Core methods
    show,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    custom,
    dismiss,
    dismissAll,

    // Utility methods
    ...utils,

    // Alias untuk backward compatibility
    toast: show,
  }
}

/**
 * Type exports untuk external usage
 */
export type { ExternalToast } from 'vue-sonner'
export type UseToastReturn = ReturnType<typeof useToast>

/**
 * Default export untuk convenience
 */
export default useToast
