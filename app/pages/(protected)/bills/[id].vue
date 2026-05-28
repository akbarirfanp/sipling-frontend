<script setup lang="ts">
import BillDetail from '~/components/BillDetail.vue'
import { useBillsQuery } from '~/features/bills/useBillsQuery'

const route = useRoute()
const { useBillQuery } = useBillsQuery()
const billId = (route.params as { id: string }).id

const billQuery = useBillQuery(billId)
const billData = computed(() => billQuery.data.value)

onMounted(async () => {
  await billQuery.refetch()
})

const pageTitle = computed(() => {
  const name = billData.value?.user?.name
  return name ? `Iuran ${name}` : 'Detail Tagihan'
})

useHead({
  title: computed(() => `${pageTitle.value} – SIPLING`),
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Detail Tagihan
      </h1>
    </div>

    <BillDetail 
      :bill-id="billId" 
    />
  </div>
</template>