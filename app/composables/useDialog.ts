import type { Component } from 'vue'
import { markRaw } from 'vue'

/**
 * Dialog options untuk konfigurasi dialog
 */
export interface DialogOptions {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  persistent?: boolean
  class?: string
  contentClass?: string
  onClose?: () => void
  onOpen?: () => void
}

/**
 * Dialog component props
 */
export interface DialogComponentProps {
  onClose?: () => void
  onSuccess?: (data?: any) => void
  onError?: (error?: any) => void
  [key: string]: any
}

/**
 * Dialog instance untuk kontrol dialog
 */
export interface DialogInstance {
  id: string
  close: () => void
  updateProps: (props: Record<string, any>) => void
}

/**
 * Dialog state management
 */
interface DialogState {
  id: string
  component: Component
  props: DialogComponentProps
  options: DialogOptions
  isOpen: boolean
  resolve?: (value?: any) => void
  reject?: (reason?: any) => void
}

/**
 * Global dialog composable yang memory-efficient
 * Menggunakan single dialog container dengan dynamic component rendering
 */
export function useDialog() {
  // Global state untuk dialog yang sedang aktif
  const activeDialog = ref<DialogState | null>(null)
  const _dialogContainer = ref<HTMLElement | null>(null)

  /**
   * Generate unique ID untuk dialog
   */
  function generateId(): string {
    return `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get size classes untuk dialog
   */
  function getSizeClasses(size: DialogOptions['size'] = 'md'): string {
    const sizeMap = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw] max-h-[95vh]',
    }
    return sizeMap[size]
  }

  /**
   * Open dialog dengan component
   */
  function open<T = any>(
    component: Component,
    props: DialogComponentProps = {},
    options: DialogOptions = {},
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Close existing dialog jika ada
      if (activeDialog.value) {
        close()
      }

      const id = generateId()

      // Setup dialog state
      activeDialog.value = {
        id,
        component: markRaw(component), // markRaw untuk prevent reactivity overhead
        props: {
          ...props,
          onClose: () => {
            close()
            props.onClose?.()
          },
          onSuccess: (data?: T) => {
            resolve(data as T)
            close()
            props.onSuccess?.(data)
          },
          onError: (error?: any) => {
            reject(error)
            props.onError?.(error)
          },
        },
        options,
        isOpen: true,
        resolve,
        reject,
      }

      // Call onOpen callback
      nextTick(() => {
        options.onOpen?.()
      })
    })
  }

  /**
   * Close active dialog
   */
  function close(data?: any): void {
    if (!activeDialog.value)
      return

    const dialog = activeDialog.value

    // Call onClose callback
    dialog.options.onClose?.()

    // Resolve dengan data jika ada, atau resolve tanpa data
    if (dialog.resolve) {
      dialog.resolve(data)
    }

    // Clear active dialog
    activeDialog.value = null
  }

  /**
   * Update props dari active dialog
   */
  function updateProps(newProps: Record<string, any>): void {
    if (!activeDialog.value)
      return

    activeDialog.value.props = {
      ...activeDialog.value.props,
      ...newProps,
    }
  }

  /**
   * Check apakah ada dialog yang sedang open
   */
  const isOpen = computed(() => activeDialog.value?.isOpen ?? false)

  /**
   * Get current dialog info
   */
  const currentDialog = computed(() => activeDialog.value)

  /**
   * Confirm dialog helper - akan diimplementasi nanti
   */
  function confirm(
    title: string,
    message: string,
    _options: Omit<DialogOptions, 'title' | 'description'> = {},
  ): Promise<boolean> {
    // TODO: Implement confirm dialog component
    return Promise.resolve(false)
  }

  /**
   * Alert dialog helper - akan diimplementasi nanti
   */
  function alert(
    title: string,
    message: string,
    _options: Omit<DialogOptions, 'title' | 'description'> = {},
  ): Promise<void> {
    // TODO: Implement alert dialog component
    return Promise.resolve()
  }

  return {
    // State
    isOpen: readonly(isOpen),
    currentDialog: readonly(currentDialog),

    // Methods
    open,
    close,
    updateProps,
    confirm,
    alert,

    // Computed
    getSizeClasses,
  }
}

/**
 * Global dialog instance untuk digunakan di seluruh aplikasi
 */
let globalDialog: ReturnType<typeof useDialog> | null = null

/**
 * Get atau create global dialog instance
 */
export function useGlobalDialog() {
  if (!globalDialog) {
    globalDialog = useDialog()
  }
  return globalDialog
}

/**
 * Shorthand untuk global dialog
 */
export const $dialog = {
  open: (...args: Parameters<ReturnType<typeof useDialog>['open']>) =>
    useGlobalDialog().open(...args),
  close: (...args: Parameters<ReturnType<typeof useDialog>['close']>) =>
    useGlobalDialog().close(...args),
  confirm: (...args: Parameters<ReturnType<typeof useDialog>['confirm']>) =>
    useGlobalDialog().confirm(...args),
  alert: (...args: Parameters<ReturnType<typeof useDialog>['alert']>) =>
    useGlobalDialog().alert(...args),
}

// Export types
export type DialogComposable = ReturnType<typeof useDialog>
export type GlobalDialogInstance = typeof $dialog
