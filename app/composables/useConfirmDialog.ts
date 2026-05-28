import { ref } from 'vue'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'confirmation' | 'alert' | 'error' | 'warning' | 'success'
  icon?: any
}

const isOpen = ref(false)
const options = ref<ConfirmDialogOptions>({
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  type: 'confirmation',
})

let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirmDialog() {
  // Confirmation dialog (OK/Cancel)
  const confirm = (opts: ConfirmDialogOptions): Promise<boolean> => {
    options.value = {
      confirmText: 'OK',
      cancelText: 'Cancel',
      type: 'confirmation',
      ...opts,
    }
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  // Alert dialog (OK only)
  const alert = (
    title: string,
    message: string,
    type: 'alert' | 'error' | 'warning' | 'success' = 'alert',
  ) => {
    options.value = {
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: '',
    }
    isOpen.value = true
    return new Promise<void>((resolve) => {
      resolvePromise = () => {
        resolve()
        resolvePromise = null
      }
    })
  }

  // Error dialog (OK only)
  const error = (title: string, message: string): Promise<void> => {
    return alert(title, message, 'error')
  }

  // Success dialog (OK only)
  const success = (title: string, message: string): Promise<void> => {
    return alert(title, message, 'success')
  }

  // Manual close (for clicking backdrop, etc)
  const closeDialog = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  // For confirmation dialog (OK/Cancel)
  const resolveConfirm = (result: boolean) => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(result)
      resolvePromise = null
    }
  }

  // For alert/success/error dialog (OK only)
  const resolveAlert = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    alert,
    error,
    success,
    closeDialog,
    resolveConfirm,
    resolveAlert,
  }
}
