<script setup lang="ts">
import { Button } from '@/components/ui/button'

const {
  success,
  error,
  warning,
  info,
  promise,
  apiSuccess,
  apiError,
  copied,
  saved,
  confirm,
} = useToast()

// Contoh API call simulation
function simulateApiCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.3 ? resolve('Data loaded successfully') : reject(new Error('Network timeout'))
    }, 2000)
  })
}

// Contoh copy to clipboard
async function copyText() {
  try {
    await navigator.clipboard.writeText('https://vitesse-ky.example.com')
    copied('Link berhasil disalin ke clipboard!')
  }
  catch {
    error('Gagal menyalin link!')
  }
}

// Contoh delete confirmation
function deleteItem() {
  confirm(
    'Apakah Anda yakin ingin menghapus item ini?',
    () => {
      // Simulate delete
      setTimeout(() => {
        success('Item berhasil dihapus!')
      }, 500)
    },
  )
}
</script>

<template>
  <div class="mx-auto p-8 container space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold">
        Welcome to Vitesse-ky
      </h1>
      <p class="text-xl text-muted-foreground">
        Modern full-stack web application dengan Nuxt 4
      </p>
      <p class="text-lg">
        Coba fitur Toast Notifications dengan useToast composable!
      </p>
    </div>

    <div class="mx-auto gap-4 grid grid-cols-1 max-w-4xl lg:grid-cols-3 md:grid-cols-2">
      <!-- Basic Toasts -->
      <div class="space-y-2">
        <h3 class="font-semibold">
          Basic Toasts
        </h3>
        <div class="space-y-2">
          <Button class="w-full" variant="default" @click="() => success('Operasi berhasil!')">
            Success Toast
          </Button>
          <Button class="w-full" variant="destructive" @click="() => error('Terjadi kesalahan!')">
            Error Toast
          </Button>
          <Button class="w-full" variant="secondary" @click="() => warning('Periksa kembali data!')">
            Warning Toast
          </Button>
          <Button class="w-full" variant="outline" @click="() => info('Informasi penting!')">
            Info Toast
          </Button>
        </div>
      </div>

      <!-- Promise Toast -->
      <div class="space-y-2">
        <h3 class="font-semibold">
          Promise Toast
        </h3>
        <Button
          class="w-full"
          variant="outline"
          @click="() => promise(simulateApiCall, {
            loading: 'Memuat data dari server...',
            success: 'Data berhasil dimuat!',
            error: (err) => `Gagal memuat data: ${err.message}`,
          })"
        >
          Simulate API Call
        </Button>
      </div>

      <!-- Utility Methods -->
      <div class="space-y-2">
        <h3 class="font-semibold">
          Utility Methods
        </h3>
        <div class="space-y-2">
          <Button class="w-full" variant="default" @click="() => apiSuccess('User berhasil dibuat!')">
            API Success
          </Button>
          <Button
            class="w-full"
            variant="destructive"
            @click="() => apiError({ response: { data: { message: 'Email sudah terdaftar' } } })"
          >
            API Error
          </Button>
          <Button class="w-full" variant="outline" @click="copyText">
            Copy Link
          </Button>
          <Button class="w-full" variant="default" @click="() => saved('Pengaturan berhasil disimpan!')">
            Save Success
          </Button>
        </div>
      </div>

      <!-- Interactive Toasts -->
      <div class="space-y-2">
        <h3 class="font-semibold">
          Interactive
        </h3>
        <div class="space-y-2">
          <Button class="w-full" variant="destructive" @click="deleteItem">
            Delete with Confirm
          </Button>
          <Button
            class="w-full"
            variant="outline"
            @click="() => confirm('Apakah Anda ingin logout?', () => info('Logout cancelled for demo'))"
          >
            Logout Confirm
          </Button>
        </div>
      </div>
    </div>

    <div class="pt-8 text-center space-y-4">
      <p class="text-muted-foreground">
        Lihat demo lengkap dan dokumentasi:
      </p>
      <div class="flex gap-4 justify-center">
        <Button as="a" href="/toast-demo" variant="default">
          📱 Toast Demo Page
        </Button>
        <Button as="a" href="https://github.com/xiaoluoboding/vue-sonner" target="_blank" variant="outline">
          📚 Vue Sonner Docs
        </Button>
      </div>
    </div>
  </div>
</template>
