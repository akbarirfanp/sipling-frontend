<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  createdAt?: string | null
  updatedAt?: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  createdAt: '',
  updatedAt: '',
  loading: false,
})

function formatDate(dateString?: string | null) {
  if (!dateString)
    return '-'
  const date = new Date(dateString)
  const day = date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${day} ${hh}:${mm}:${ss}`
}

function getInitials(name?: string | null) {
  if (!name)
    return '-'
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

const formattedCreatedAt = computed(() => formatDate(props.createdAt))
const formattedUpdatedAt = computed(() => formatDate(props.updatedAt))
</script>

<template>
  <CnCard class="py-0 border-0 gap-0 shadow-md">
    <!-- Loading state skeleton -->
    <div v-if="loading" class="animate-pulse">
      <div class="px-6 py-4 flex items-center justify-between">
        <CnSkeleton class="h-4 w-20" />
        <div class="flex gap-2 items-center">
          <CnSkeleton class="rounded-full h-5 w-5" />
          <CnSkeleton class="h-4 w-24" />
        </div>
      </div>
      <div class="px-6 py-4 bg-muted flex gap-2 items-center">
        <CnSkeleton class="h-5 w-5" />
        <CnSkeleton class="h-4 w-32" />
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <CnSkeleton class="h-4 w-24" />
        <div class="flex gap-2 items-center">
          <CnSkeleton class="rounded-full h-5 w-5" />
          <CnSkeleton class="h-4 w-28" />
        </div>
      </div>
      <div class="px-6 py-4 bg-muted flex gap-2 items-center">
        <CnSkeleton class="h-5 w-5" />
        <CnSkeleton class="h-4 w-32" />
      </div>
    </div>

    <!-- Actual content when not loading -->
    <div v-else>
      <div class="px-6 py-4 flex items-center justify-between">
        <p class="text-sm">
          Tanggal Pembuatan
        </p>
      </div>
      <div class="text-neutral-400 px-6 py-4 bg-muted flex flex-row gap-2 items-center">
        <Icon name="ph:calendar-blank" size="20" />
        <p class="text-sm">
          {{ formattedCreatedAt }}
        </p>
      </div>
      <div class="px-6 py-4 flex items-center justify-between">
        <p class="text-sm">
          Terakhir Diperbarui
        </p>
      </div>
      <div class="text-neutral-400 px-6 py-4 bg-muted flex flex-row gap-2 items-center">
        <Icon name="ph:calendar-blank" size="20" />
        <p class="text-sm">
          {{ formattedUpdatedAt }}
        </p>
      </div>
    </div>
  </CnCard>
</template>
