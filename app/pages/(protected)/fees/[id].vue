<script setup lang="ts">
import FeeDetail from '~/components/FeeDetail.vue'
import { useFeesQuery } from '~/features/fees/useFeesQuery'
import DeleteButtonFees from '~/features/fees/components/DeleteButtonFees.vue'
const route = useRoute()
const { useFeeQuery } = useFeesQuery()
const feeId = (route.params as { id: string }).id
const tableRefreshKey = ref(0)

const feeQuery = useFeeQuery(feeId)

const feeData = computed(() => {
  return feeQuery.data.value
})

const isLoadingFee= ref(false)

function refreshTable() {
  tableRefreshKey.value++
}

watch(feeData, (newData, oldData) => {
  if (newData && oldData && newData !== oldData) {
    nextTick(() => {
      refreshTable()
    })
  }
})

watch(() => 'id' in route.params ? route.params.id : null, (newId) => {
  if (newId) {
    refreshTable()
  }
})

onMounted(async () => {
  await feeQuery.refetch()
  await nextTick()
  refreshTable()
})

const pageTitle = computed(() => {
  const name = feeData.value?.name
  return name ? `Iuran ${name}` : 'Detail Iuran'
})

useHead({
  title: computed(() => `${pageTitle.value} – Solutif CX`),
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Detail Iuran
      </h1>
    </div>

    <div class="gap-4 grid grid-cols-1 md:grid-cols-3">
      <div class="md:col-span-2">
        <FeeDetail
          :fee-id="feeId"
          editable
        />

      </div>
      <div>
        <Timestamp
          :created-by="feeData?.createdByName"
          :created-at="feeData?.createdAt"
          :updated-by="feeData?.updatedByName"
          :updated-at="feeData?.updatedAt"
          :loading="isLoadingFee"
        />
        <DeleteButtonFees
          :fee-id="feeId"
          :loading="false"
        />
      </div>
    </div>
  </div>
</template>
