<script setup lang="ts">
import { computed, provide } from 'vue'

// Extended interface untuk ellipsis items
interface ExtendedBreadcrumbItem extends BreadcrumbItem {
  isEllipsis?: boolean
  hiddenItems?: BreadcrumbItem[]
}

interface Props {
  options?: BreadcrumbOptions
  items?: BreadcrumbItem[]
  showDropdown?: boolean
  responsive?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDropdown: true,
  responsive: true,
})

const emit = defineEmits<{
  navigate: [item: BreadcrumbItem]
  itemClick: [item: BreadcrumbItem, index: number]
}>()

// Initialize breadcrumb composable
const breadcrumb = useBreadcrumb(props.options)

// Override dengan manual items jika ada
if (props.items) {
  breadcrumb.setBreadcrumbs(props.items)
}

// Computed untuk responsive breadcrumb
const displayItems = computed(() => {
  try {
    const items = breadcrumb?.breadcrumbItems?.value

    // Ensure items is always an array to prevent hydration mismatch
    if (!Array.isArray(items) || items.length === 0) {
      return [] as ExtendedBreadcrumbItem[]
    }

    if (!props.responsive || items.length <= 3) {
      return items as ExtendedBreadcrumbItem[]
    }

    // Untuk responsive: tampilkan first, ellipsis, dan last 2 items
    const first = items[0]
    const last = items.slice(-2)
    const middle = items.slice(1, -2)

    if (middle.length === 0 || !first) {
      return items as ExtendedBreadcrumbItem[]
    }

    const result: ExtendedBreadcrumbItem[] = [
      first,
      { label: '...', disabled: true, isEllipsis: true, hiddenItems: middle },
      ...last,
    ]

    return result
  }
  catch (error) {
    console.warn('Error in displayItems computed:', error)
    return [] as ExtendedBreadcrumbItem[]
  }
})

// Handle navigation
function handleNavigate(item: BreadcrumbItem, index: number) {
  if (!item)
    return

  emit('itemClick', item, index)

  if (!item.disabled && !item.active && breadcrumb) {
    breadcrumb.navigateTo(item)
    emit('navigate', item)
  }
}

// Handle dropdown item click
function handleDropdownItemClick(item: BreadcrumbItem) {
  if (!item || !breadcrumb)
    return

  breadcrumb.navigateTo(item)
  emit('navigate', item)
}

// Provide breadcrumb context untuk child components
provide('breadcrumb', breadcrumb)
</script>

<template>
  <ClientOnly>
    <CnBreadcrumb :class="props.class">
      <CnBreadcrumbList>
        <template v-for="(item, index) in displayItems" :key="index">
          <template v-if="item">
            <!-- Regular breadcrumb item -->
            <CnBreadcrumbItem v-if="!item.isEllipsis">
              <!-- Active/Current page -->
              <CnBreadcrumbPage v-if="item.active" class="flex items-center">
                <!-- <component :is="item.icon" v-if="item.icon" class="mr-1 h-4 w-4" /> -->
                <Icon v-if="item.icon" :name="item.icon" class="mr-1 h-4 w-4" />
                {{ item.label }}
              </CnBreadcrumbPage>

              <!-- Clickable link -->
              <CnBreadcrumbLink
                v-else-if="!item.disabled"
                :href="item.href"
                class="flex items-center"
                :class="{
                  'cursor-pointer hover:text-foreground transition-colors': !item.disabled,
                  'opacity-50 cursor-not-allowed': item.disabled,
                }"
                @click.prevent="handleNavigate(item, index)"
              >
                <!-- <component :is="item.icon" v-if="item.icon" class="mr-1 h-4 w-4" /> -->
                <Icon v-if="item.icon" :name="item.icon" class="mr-1 h-4 w-4" />
                {{ item.label }}
              </CnBreadcrumbLink>

              <!-- Disabled item -->
              <span v-else class="opacity-50 flex cursor-not-allowed items-center">
                <!-- <component :is="item.icon" v-if="item.icon" class="mr-1 h-4 w-4" /> -->
                <Icon v-if="item.icon" :name="item.icon" class="mr-1 h-4 w-4" />
                {{ item.label }}
              </span>
            </CnBreadcrumbItem>

            <!-- Ellipsis dengan dropdown -->
            <CnBreadcrumbItem v-else>
              <CnDropdownMenu v-if="showDropdown && item.hiddenItems?.length">
                <CnDropdownMenuTrigger as-child>
                  <CnBreadcrumbEllipsis class="p-1 rounded-md cursor-pointer hover:bg-muted" />
                </CnDropdownMenuTrigger>
                <CnDropdownMenuContent align="start" class="w-48">
                  <CnDropdownMenuItem
                    v-for="(hiddenItem, hiddenIndex) in item.hiddenItems"
                    :key="hiddenIndex"
                    class="flex cursor-pointer items-center"
                    @click="handleDropdownItemClick(hiddenItem)"
                  >
                    <!-- <component :is="hiddenItem.icon" v-if="hiddenItem.icon" class="mr-2 h-4 w-4" /> -->
                    <Icon v-if="hiddenItem.icon" :name="hiddenItem.icon" class="mr-2 h-4 w-4" />
                    {{ hiddenItem.label }}
                  </CnDropdownMenuItem>
                </CnDropdownMenuContent>
              </CnDropdownMenu>
              <CnBreadcrumbEllipsis v-else />
            </CnBreadcrumbItem>

            <!-- Separator -->
            <CnBreadcrumbSeparator v-if="index < displayItems.length - 1">
              <slot name="separator">
                <ClientOnly>
                  <span v-if="props.options?.separator" class="text-muted-foreground">{{ props.options.separator }}</span>
                  <Icon v-else name="ph:caret-right" class="h-4 w-4" />
                  <template #fallback>
                    <span>/</span>
                  </template>
                </ClientOnly>
              </slot>
            </CnBreadcrumbSeparator>
          </template>
        </template>
      </CnBreadcrumbList>

      <!-- Slot untuk custom content -->
      <slot :breadcrumb="breadcrumb" :items="displayItems" />
    </CnBreadcrumb>
    <template #fallback>
      <!-- Fallback content during hydration -->
      <div class="text-sm text-muted-foreground">
        Loading breadcrumb...
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
/* Custom styles untuk breadcrumb */
.breadcrumb-item-enter-active,
.breadcrumb-item-leave-active {
  transition: all 0.3s ease;
}

.breadcrumb-item-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.breadcrumb-item-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
