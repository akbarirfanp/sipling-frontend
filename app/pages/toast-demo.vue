<script setup lang="ts">
import { defineComponent, h } from 'vue'
import { Button } from '~/components/ui/button'

const {
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
  apiSuccess,
  apiError,
  validationError,
  networkError,
  copied,
  saved,
  deleted,
  unauthorized,
  confirm,
  undo,
} = useToast()

// Basic toasts
function showDefault() {
  show('Ini adalah toast default')
}

function showSuccess() {
  success('Operasi berhasil dilakukan!')
}

function showError() {
  error('Terjadi kesalahan dalam sistem!')
}

function showWarning() {
  warning('Peringatan: Periksa kembali data Anda!')
}

function showInfo() {
  info('Informasi: Fitur baru telah tersedia!')
}

// Advanced toasts
function showWithAction() {
  show('Toast dengan action button', {
    action: {
      label: 'Lihat Detail',
      onClick: () => console.warn('detail clicked'),
    },
  })
}

function showWithDescription() {
  success('Berhasil!', {
    description: 'Data telah berhasil disimpan ke database dengan ID #12345',
  })
}

function showPersistent() {
  show('Toast yang tidak hilang otomatis', {
    duration: Infinity,
    closeButton: true,
  })
}

function showLoading() {
  const toastId = loading('Memproses data...')

  // Simulate async operation
  setTimeout(() => {
    dismiss(toastId)
    success('Proses selesai!')
  }, 3000)
}

function showPromise() {
  const mockApiCall = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.5 ? resolve('Data loaded') : reject(new Error('Network error'))
    }, 2000)
  })

  promise(mockApiCall, {
    loading: 'Memuat data dari server...',
    success: 'Data berhasil dimuat!',
    error: err => `Gagal memuat data: ${err.message}`,
  })
}

function showCustom() {
  const CustomToast = defineComponent({
    setup() {
      return () => h('div', {
        class: 'flex items-center gap-2 p-2',
        innerHTML: '🎉 <strong>Custom Component Toast!</strong> <span>Dengan HTML dan styling custom</span>',
      })
    },
  })

  custom({
    component: CustomToast,
    duration: 5000,
  })
}

// Utility methods
function simulateApiSuccess() {
  apiSuccess('User berhasil dibuat!')
}

function simulateApiError() {
  const mockError = {
    response: {
      data: {
        message: 'Email sudah terdaftar dalam sistem',
      },
    },
  }
  apiError(mockError)
}

function simulateValidationError() {
  validationError('Email dan password wajib diisi!')
}

function simulateNetworkError() {
  networkError()
}

function simulateCopy() {
  copied('Link berhasil disalin ke clipboard!')
}

function simulateSave() {
  saved('Pengaturan berhasil disimpan!')
}

function simulateDelete() {
  deleted('User berhasil dihapus dari sistem!')
}

function simulateUnauthorized() {
  unauthorized('Anda tidak memiliki akses untuk menghapus user ini!')
}

// Interactive toasts
function showConfirm() {
  confirm(
    'Apakah Anda yakin ingin menghapus data ini?',
    () => {
      success('Data berhasil dihapus!')
    },
  )
}

function showUndo() {
  undo(
    'Data telah dihapus',
    () => {
      info('Data berhasil dikembalikan!')
    },
  )
}

// Position demo
function showAtPosition(position: any) {
  show(`Toast di posisi ${position}`, {
    position,
    duration: 3000,
  })
}

// Page meta
definePageMeta({
  title: 'Toast Demo',
  description: 'Demo lengkap useToast composable',
})
</script>

<template>
  <div class="mx-auto p-6 container space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">
        Toast Demo - useToast Composable
      </h1>
      <p class="text-muted-foreground">
        Contoh lengkap penggunaan toast notifications
      </p>
    </div>

    <!-- Basic Toasts -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Basic Toasts
      </h2>
      <div class="gap-4 grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3">
        <Button variant="outline" @click="showDefault">
          Default Toast
        </Button>
        <Button variant="default" @click="showSuccess">
          Success Toast
        </Button>
        <Button variant="destructive" @click="showError">
          Error Toast
        </Button>
        <Button variant="secondary" @click="showWarning">
          Warning Toast
        </Button>
        <Button variant="secondary" @click="showInfo">
          Info Toast
        </Button>
      </div>
    </div>

    <!-- Advanced Toasts -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Advanced Toasts
      </h2>
      <div class="gap-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
        <Button variant="outline" @click="showWithAction">
          Toast with Action
        </Button>
        <Button variant="outline" @click="showWithDescription">
          Toast with Description
        </Button>
        <Button variant="outline" @click="showPersistent">
          Persistent Toast
        </Button>
        <Button variant="outline" @click="showLoading">
          Loading Toast
        </Button>
        <Button variant="outline" @click="showPromise">
          Promise Toast
        </Button>
        <Button variant="outline" @click="showCustom">
          Custom Component
        </Button>
      </div>
    </div>

    <!-- Utility Methods -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Utility Methods
      </h2>
      <div class="gap-4 grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2">
        <Button variant="default" @click="simulateApiSuccess">
          API Success
        </Button>
        <Button variant="destructive" @click="simulateApiError">
          API Error
        </Button>
        <Button variant="secondary" @click="simulateValidationError">
          Validation Error
        </Button>
        <Button variant="destructive" @click="simulateNetworkError">
          Network Error
        </Button>
        <Button variant="outline" @click="simulateCopy">
          Copy Success
        </Button>
        <Button variant="default" @click="simulateSave">
          Save Success
        </Button>
        <Button variant="destructive" @click="simulateDelete">
          Delete Success
        </Button>
        <Button variant="destructive" @click="simulateUnauthorized">
          Unauthorized
        </Button>
      </div>
    </div>

    <!-- Interactive Toasts -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Interactive Toasts
      </h2>
      <div class="gap-4 grid grid-cols-1 md:grid-cols-3">
        <Button variant="outline" @click="showConfirm">
          Confirmation Toast
        </Button>
        <Button variant="outline" @click="showUndo">
          Undo Toast
        </Button>
        <Button variant="destructive" @click="dismissAll">
          Dismiss All Toasts
        </Button>
      </div>
    </div>

    <!-- Position Demo -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Position Demo
      </h2>
      <div class="gap-4 grid grid-cols-2 md:grid-cols-3">
        <Button variant="outline" @click="() => showAtPosition('top-left')">
          Top Left
        </Button>
        <Button variant="outline" @click="() => showAtPosition('top-center')">
          Top Center
        </Button>
        <Button variant="outline" @click="() => showAtPosition('top-right')">
          Top Right
        </Button>
        <Button variant="outline" @click="() => showAtPosition('bottom-left')">
          Bottom Left
        </Button>
        <Button variant="outline" @click="() => showAtPosition('bottom-center')">
          Bottom Center
        </Button>
        <Button variant="outline" @click="() => showAtPosition('bottom-right')">
          Bottom Right
        </Button>
      </div>
    </div>

    <!-- Code Examples -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Code Examples
      </h2>
      <div class="space-y-4">
        <div class="p-4 rounded-lg bg-muted">
          <h3 class="font-semibold mb-2">
            Basic Usage:
          </h3>
          <pre class="text-sm overflow-x-auto"><code>const { success, error, warning, info } = useToast()

// Basic toasts
success('Data berhasil disimpan!')
error('Terjadi kesalahan!')
warning('Periksa kembali data!')
info('Informasi penting')</code></pre>
        </div>

        <div class="p-4 rounded-lg bg-muted">
          <h3 class="font-semibold mb-2">
            Promise Toast:
          </h3>
          <pre class="text-sm overflow-x-auto"><code>const { promise } = useToast()

promise(
  fetch('/api/data'),
  {
    loading: 'Memuat data...',
    success: 'Data berhasil dimuat!',
    error: 'Gagal memuat data!'
  }
)</code></pre>
        </div>

        <div class="p-4 rounded-lg bg-muted">
          <h3 class="font-semibold mb-2">
            Utility Methods:
          </h3>
          <pre class="text-sm overflow-x-auto"><code>const { apiSuccess, apiError, copied, saved } = useToast()

// API responses
apiSuccess('User berhasil dibuat!')
apiError(error) // Auto extract error message

// Common actions
copied() // 'Berhasil disalin!'
saved() // 'Data berhasil disimpan!'</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
