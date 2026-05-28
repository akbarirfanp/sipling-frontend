<script setup lang="ts">
const props = defineProps<{
  billId: string
  status: string
}>()

const { $repos } = useNuxtApp()
const isPaying = ref(false)

async function handleBayar() {
  isPaying.value = true
  try {
    // ✅ Cek snap tersedia dulu
    if (!window.snap) {
      throw new Error('Midtrans Snap belum ter-load, refresh halaman dan coba lagi.')
    }

    const result = await $repos.payments.getSnapToken(props.billId)
    const snapToken = result.snapToken 

    if (!snapToken) {
      throw new Error('Snap token tidak ditemukan')
    }

    window.snap.pay(snapToken, {
      // ...sama seperti sebelumnya
    })
  }
  catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Terjadi kesalahan')
  }
  finally {
    isPaying.value = false
  }
}
</script>

<template>
    <CnButton
      v-if="status === 'unpaid'"
      class="w-full"
      :disabled="isPaying"
      @click="handleBayar"
    >
      <Icon
        v-if="isPaying"
        name="ph:spinner"
        class="mr-2 h-4 w-4 animate-spin"
      />
      {{ isPaying ? 'Memproses...' : 'Bayar Sekarang' }}
    </CnButton>

    <div
      v-else
      class="flex items-center gap-2 text-green-600"
    >
      <Icon name="ph:check-circle" class="h-5 w-5" />
      <span class="text-sm font-medium">Tagihan sudah dibayar</span>
    </div>
</template>