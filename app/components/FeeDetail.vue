<script setup lang="ts">
import EditButtonFee from '~/features/fees/components/editButtonFees.vue'
import { useFee } from '~/features/fees/useFees'
import { useFeesQuery } from '~/features/fees/useFeesQuery'

interface Props {
  feeId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const { useFeeQuery } = useFeesQuery()
const feeQuery = useFeeQuery(props.feeId)

const updateFeeRef = ref()
function openEditModal() {
  updateFeeRef.value?.handleEdit()
}

const avatarText = computed(() => {
  const name = feeQuery.data.value?.name
  if (!name?.trim())
    return 'N/A'
  return name.trim()
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
})

async function handleEditSuccess() {
  await feeQuery.refetch()
  // await qc.refetchQueries({ queryKey: ['log-application'] })
}
</script>

<template>
  <div class="border rounded-lg bg-white shadow-sm">
    <!-- Loading State -->
    <div v-if="feeQuery.isLoading.value" class="p-6 animate-pulse">
      <div class="mb-6 flex items-start justify-between">
        <div class="flex gap-3 items-center">
          <CnSkeleton class="rounded-full size-12" />
          <div class="space-y-1">
            <CnSkeleton class="h-5 w-32" />
            <CnSkeleton class="h-4 w-16" />
          </div>
        </div>
        <CnSkeleton v-if="editable" class="rounded h-8 w-8" />
      </div>
      <div class="space-y-4">
        <CnSkeleton class="h-5 w-40" />
        <div class="gap-4 grid grid-cols-2">
          <div v-for="i in 8" :key="`skeleton-${i}`" class="space-y-1">
            <CnSkeleton class="h-3 w-24" />
            <CnSkeleton class="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="feeQuery.isError.value" class="p-6 text-center">
      <p class="text-sm text-red-600 mb-3">
        Failed to load fee details
      </p>
      <button
        class="text-sm text-white px-4 py-2 rounded bg-blue-500 hover:bg-blue-600"
        @click="feeQuery.refetch()"
      >
        Retry
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="feeQuery.data.value" class="p-6">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div class="flex gap-3 items-center">

          <div>
            <h1 class="text-base text-gray-900 font-semibold mb-1">
              {{ feeQuery.data.value.name || 'No Name Available' }}
            </h1>
          </div>
        </div>

        <button
          v-if="editable"
          class="p-2 border border-gray-200 rounded transition-colors hover:bg-gray-50"
          @click="openEditModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path fill="currentColor" d="m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM92.69 208H48v-44.69l88-88L180.69 120ZM192 108.69L147.31 64l24-24L216 84.69Z" />
          </svg>
        </button>
      </div>

      <!-- Account Information Section -->
      <div class="mb-6">
        <h2 class="text-sm text-gray-900 font-semibold mb-4 px-3 py-2 rounded bg-gray-50">
          Informasi Iuran
        </h2>
        <div class="gap-x-6 gap-y-4 grid grid-cols-2">
          <div>
            <p class="text-xs text-gray-500 mb-1">
              Nama Iuran
            </p>
            <p class="text-sm text-gray-900">
              {{ feeQuery.data.value.name || '-' }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500 mb-1">
              Periode
            </p>
            <p class="text-sm text-gray-900">
              {{ feeQuery.data.value.period || '-' }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500 mb-1">
              Nominal
            </p>
            <p class="text-sm text-gray-900">
              {{ feeQuery.data.value.amount ? `Rp ${feeQuery.data.value.amount.toLocaleString('id-ID')}` : '-' }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500 mb-1">
              Deskripsi
            </p>
            <p class="text-sm text-gray-900">
              {{ feeQuery.data.value.description || '-' }}
            </p>
          </div>

        </div>
      </div>

        <EditButtonFee
          v-if="editable"
          ref="updateFeeRef"
          :fee-id="feeId"
          :fee-name="feeQuery.data.value?.name || ''"
          @edit-success="handleEditSuccess"
        />
      </div>
    </div>

</template>
