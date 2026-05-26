<script setup lang="ts">
import { computed } from 'vue'

interface Field {
  label: string
  value: string
  url?: string
}

interface Props {
  showAvatar?: boolean
  name: string
  code?: string
  status: boolean
  fields?: Field[]
  editable?: boolean
  loading?: boolean
  variant?: 'grid' | 'list'
  cols?: number
  labelWidth?: string
  linkClass?: string
  labelClass?: string
  valueClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: false,
  fields: () => [],
  editable: false,
  loading: false,
  variant: 'grid',
  cols: 3,
  labelWidth: '160px',
  linkClass: 'text-sm text-blue-700',
  labelClass: 'text-[14px] font-medium',
  valueClass: 'text-sm text-gray-700',
})

const emit = defineEmits<{
  (e: 'edit'): void
}>()

const hasFields = computed(() => (props.fields?.length ?? 0) > 0)

// Avatar initials computed
const avatar = computed(() => {
  if (!props.showAvatar || !props.name)
    return ''
  return props.name
    .trim()
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
})
</script>

<template>
  <CnCard class="mb-4 p-6">
    <!-- Loading state skeleton -->
    <div v-if="loading" class="animate-pulse">
      <div class="flex gap-4 items-center">
        <CnSkeleton v-if="showAvatar" class="rounded-full size-14" />
        <div class="flex w-full justify-between">
          <div class="flex flex-col gap-1">
            <CnSkeleton class="h-6 w-48" />
            <div class="flex gap-2 items-center">
              <CnSkeleton class="h-4 w-32" />
              <CnSkeleton class="rounded-full h-6 w-20" />
            </div>
          </div>
          <CnSkeleton v-if="editable" class="rounded h-8 w-8" />
        </div>
      </div>

      <!-- Skeleton for fields by variant -->
      <div v-if="hasFields && variant === 'grid'" class="mt-4 gap-2 grid" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }">
        <div v-for="(_, index) in fields" :key="`skeleton-grid-${index}`" class="space-y-2">
          <CnSkeleton class="h-4 w-20" />
          <CnSkeleton class="h-4 w-32" />
        </div>
      </div>

      <div v-else-if="hasFields && variant === 'list'" class="mt-6 gap-y-2 grid grid-cols-1">
        <div v-for="(_, index) in fields" :key="`skeleton-list-${index}`" class="flex gap-2 items-center">
          <CnSkeleton class="h-4" :style="{ width: labelWidth }" />
          <span class="mx-2">:</span>
          <CnSkeleton class="h-4 w-40" />
        </div>
      </div>
    </div>

    <!-- Actual content when not loading -->
    <div v-else>
      <div class="flex gap-4 items-center">
        <CnAvatar v-if="showAvatar" class="size-14">
          <CnAvatarFallback>{{ avatar }}</CnAvatarFallback>
        </CnAvatar>
        <div class="flex w-full justify-between">
          <div class="flex flex-col gap-1">
            <h2 class="text-xl font-semibold">
              {{ name }}
            </h2>
            <p class="text-sm text-muted-foreground flex gap-1 items-center">
              <span v-if="code">{{ code }} -</span>
              <span
                class="text-xs font-medium px-2 py-1 rounded-full flex gap-1 items-center"
                :class="status ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
              >
                <span class="rounded-full h-2 w-2" :class="status ? 'bg-green-700' : 'bg-red-700'" />
                {{ status ? 'Active' : 'Non Active' }}
              </span>
            </p>
          </div>
          <div
            v-if="editable"
            class="border rounded flex h-8 w-8 cursor-pointer transition-colors items-center justify-center hover:bg-muted"
            aria-label="Edit"
            @click="emit('edit')"
          >
            <Icon name="ph:pencil-simple" class="h-4 w-4" />
          </div>
        </div>
      </div>

      <!-- GRID variant (default) -->
      <div v-if="hasFields && variant === 'grid'" class="mt-4 gap-2 grid" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }">
        <div v-for="(field, index) in fields" :key="index">
          <p :class="labelClass">
            {{ field.label }}
          </p>
          <NuxtLink
            v-if="field.url"
            :to="field.url"
            :class="linkClass"
          >
            {{ field.value }}
          </NuxtLink>
          <p v-else :class="[valueClass]">
            {{ field.value }}
          </p>
        </div>
      </div>

      <!-- LIST variant -->
      <div v-else-if="hasFields && variant === 'list'" class="mt-6 gap-x-4 gap-y-2 grid grid-cols-1">
        <div v-for="(field, index) in fields" :key="index" class="flex">
          <span class="text-[14px]" :style="{ minWidth: labelWidth }">{{ field.label }}</span>
          <span class="mx-2">:</span>
          <span>
            <NuxtLink
              v-if="field.url"
              :to="field.url"
              :class="linkClass"
            >
              {{ field.value }}
            </NuxtLink>
            <span v-else :class="valueClass">{{ field.value }}</span>
          </span>
        </div>
      </div>
    </div>
  </CnCard>
</template>
