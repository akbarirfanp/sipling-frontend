<script setup lang="ts" generic="T extends ScxSelectOption = ScxSelectOption">
import { cn } from '@/lib/utils'

interface ScxSelectProps {
  modelValue?: string | string[]
  options?: ScxSelectOption[]
  placeholder?: string
  multiple?: boolean
  creatable?: boolean
  async?: boolean
  virtual?: boolean
  loading?: boolean
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  searchable?: boolean
  filterFn?: ScxSelectFilterFn
  fetcher?: ScxSelectFetcher
  itemHeight?: number
  maxHeight?: string
  size?: 'sm' | 'default' | 'md'
  variant?: 'default' | 'outline'
  class?: string
  defaultItems?: ScxSelectOption[]
}

interface ScxSelectEmits {
  'update:modelValue': [value: string | string[]]
  'open-change': [open: boolean]
  'search': [query: string]
  'create': [value: string]
  'reach-end': []
  'clear': []
}

interface ExtendedScxSelectProps extends ScxSelectProps {
  autoTeleport?: boolean
  teleportTo?: string | Element
  zIndex?: number
}

const props = withDefaults(defineProps<ExtendedScxSelectProps>(), {
  placeholder: 'Select option...',
  multiple: false,
  creatable: false,
  async: false,
  virtual: false,
  loading: false,
  disabled: false,
  invalid: false,
  clearable: false,
  searchable: true,
  itemHeight: 32,
  maxHeight: '200px',
  size: 'default',
  variant: 'default',
  autoTeleport: true,
  zIndex: undefined,
})

const emit = defineEmits<ScxSelectEmits>()

const modelValue = computed({
  get: () => props.modelValue || (props.multiple ? [] : ''),
  set: value => emit('update:modelValue', value),
})

const isMounted = ref(false)
const triggerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

const dropdownPosition = ref({ top: 0, left: 0, width: 0 })
const isFlippedUp = ref(false)

const teleportTarget = ref<string | Element>('body')
const dynamicZIndex = ref<number>(50)

const selectComposable = useScxSelect({
  options: props.options ?? props.defaultItems,
  modelValue,
  multiple: props.multiple,
  creatable: props.creatable,
  async: props.async,
  virtual: props.virtual,
  searchable: props.searchable,
  filterFn: props.filterFn,
  fetcher: props.fetcher,
  itemHeight: props.itemHeight,
})

const {
  isOpen,
  searchQuery,
  loading: internalLoading,
  displayOptions,
  selectedValues,
  containerRef: _containerRef,
  highlightedIndex,
  hasMore,
  isSelected,
  selectOption,
  clearSelection,
  handleKeydown,
  loadMore,
} = selectComposable

const virtualList = 'virtualList' in selectComposable ? selectComposable.virtualList : ref([])
const containerProps = 'containerProps' in selectComposable ? selectComposable.containerProps : {}
const wrapperProps = 'wrapperProps' in selectComposable ? selectComposable.wrapperProps : {}

const isLoading = computed(() => props.loading || internalLoading.value)

const selectedOptions = computed(() => {
  const { allOptions } = selectComposable
  return allOptions.value.filter((option: ScxSelectOption) =>
    selectedValues.value.includes(option.value),
  )
})

const displayValue = computed(() => {
  if (selectedOptions.value.length === 0)
    return ''
  if (props.multiple)
    return selectedOptions.value.map(o => o.label).join(', ')
  return selectedOptions.value[0]?.label || ''
})

function detectTeleportTarget(): string | Element {
  if (!props.autoTeleport) {
    return props.teleportTo || 'body'
  }
  if (!triggerRef.value)
    return 'body'

  const dialogSelectors = ['[role="dialog"]']
  let el: Element | null = triggerRef.value.parentElement

  while (el && el !== document.body) {
    for (const sel of dialogSelectors) {
      if (el.matches?.(sel))
        return el
    }
    const style = window.getComputedStyle(el)
    const z = Number.parseInt(style.zIndex)
    if (z > 1000)
      return el
    el = el.parentElement
  }
  return 'body'
}

function calculateZIndex(): number {
  if (props.zIndex)
    return props.zIndex
  if (!triggerRef.value)
    return 9999
  let maxZ = 50
  let el = triggerRef.value.parentElement
  while (el && el !== document.body) {
    const z = Number.parseInt(window.getComputedStyle(el).zIndex)
    if (!Number.isNaN(z) && z > maxZ)
      maxZ = z
    el = el.parentElement
  }
  return maxZ + 100
}

const isBodyTarget = computed(() => {
  const t = teleportTarget.value
  return t === 'body' || t === document.body
})

function updateDropdownPosition() {
  if (!triggerRef.value)
    return
  const rect = triggerRef.value.getBoundingClientRect()
  const searchHeight = props.searchable ? 40 : 0
  const dropdownHeight = 200 + 8 + 2 + searchHeight
  const viewportH = window.innerHeight
  const viewportW = window.innerWidth
  const spaceBelow = viewportH - rect.bottom - 8
  const spaceAbove = rect.top - 8
  const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
  isFlippedUp.value = shouldFlipUp

  let vpLeft = rect.left
  const vpTop = shouldFlipUp
    ? Math.max(8, rect.top - dropdownHeight - 10)
    : Math.min(viewportH - dropdownHeight - 8, rect.bottom)

  if (vpLeft + rect.width > viewportW)
    vpLeft = viewportW - rect.width - 8
  if (vpLeft < 8)
    vpLeft = 8

  if (isBodyTarget.value) {
    dropdownPosition.value = { top: vpTop, left: vpLeft, width: rect.width }
  }
  else {
    const container = teleportTarget.value as Element
    const cRect = container.getBoundingClientRect()
    const cScrollTop = (container as HTMLElement).scrollTop ?? 0
    const cScrollLeft = (container as HTMLElement).scrollLeft ?? 0
    dropdownPosition.value = {
      top: vpTop - cRect.top + cScrollTop,
      left: vpLeft - cRect.left + cScrollLeft,
      width: rect.width,
    }
  }
}

function toggleOpen() {
  if (props.disabled)
    return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    teleportTarget.value = detectTeleportTarget()
    dynamicZIndex.value = calculateZIndex()
    updateDropdownPosition()
  }
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('open-change', isOpen.value)
}

function handleClear(e: Event) {
  e.stopPropagation()
  clearSelection()
  searchQuery.value = ''
  emit('search', '')
  emit('clear')
}

function handleSearch(query: string) {
  searchQuery.value = query
  emit('search', query)
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore.value) {
    loadMore()
    // eslint-disable-next-line vue/custom-event-name-casing
    emit('reach-end')
  }
}

// FIX: Improved handleClickOutside
function handleClickOutside(e: Event) {
  if (!triggerRef.value || !contentRef.value)
    return
  const target = e.target as Node

  // PENTING: Jangan close dropdown jika klik di dalam dropdown content
  if (contentRef.value.contains(target)) {
    return
  }

  // Jangan close jika klik di trigger
  if (triggerRef.value.contains(target)) {
    return
  }

  // Check if click is inside a dialog/modal backdrop - IMPROVED
  const dialogBackdrop = (target as Element).closest('[data-state="open"]')
  const modalOverlay = (target as Element).closest('.fixed.inset-0')

  // Jika klik di modal backdrop/overlay, tutup dropdown
  if (dialogBackdrop || modalOverlay) {
    isOpen.value = false
    // eslint-disable-next-line vue/custom-event-name-casing
    emit('open-change', false)
    return
  }

  // Close dropdown untuk klik di luar
  isOpen.value = false
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('open-change', false)
}

function handleOptionClick(option: ScxSelectOption, e: Event) {
  e.stopPropagation()
  e.preventDefault()
  selectOption(option)
}

watch(isOpen, (open) => {
  if (open && searchInputRef.value) {
    nextTick(() => searchInputRef.value?.focus())
  }
})

function handleWindowScroll() {
  if (isOpen.value)
    updateDropdownPosition()
}

let containerScrollEl: Element | null = null

onMounted(() => {
  isMounted.value = true

  if (props.async && props.defaultItems?.length) {
    const { allOptions } = selectComposable
    const existingValues = new Set(allOptions.value.map(o => o.value))
    const merged = [
      ...props.defaultItems.filter(o => !existingValues.has(o.value)),
      ...allOptions.value,
    ]
    allOptions.value = merged
    searchQuery.value = props.defaultItems[0]?.label || ''
  }

  document.addEventListener('click', handleClickOutside, true) // FIX: Use capture phase
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleWindowScroll)
  window.addEventListener('scroll', handleWindowScroll, true)

  watch([isOpen, teleportTarget], ([open]) => {
    if (containerScrollEl) {
      containerScrollEl.removeEventListener('scroll', handleWindowScroll, true)
      containerScrollEl = null
    }
    if (open && !isBodyTarget.value && teleportTarget.value instanceof Element) {
      containerScrollEl = teleportTarget.value
      containerScrollEl.addEventListener('scroll', handleWindowScroll, true)
    }
  }, { flush: 'post' })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true) // FIX: Use capture phase
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleWindowScroll)
  window.removeEventListener('scroll', handleWindowScroll, true)
  if (containerScrollEl) {
    containerScrollEl.removeEventListener('scroll', handleWindowScroll, true)
  }
})
</script>

<template>
  <div class="w-full relative">
    <!-- Trigger -->
    <div v-if="$slots.trigger" ref="triggerRef" @click="toggleOpen">
      <slot
        name="trigger"
        :value="modelValue"
        :placeholder="placeholder"
        :open="isOpen"
        :selected-options="selectedOptions"
        :display-value="displayValue"
        :toggle-open="toggleOpen"
        :handle-clear="handleClear"
        :clearable="clearable && selectedValues.length > 0"
      />
    </div>
    <div
      v-else
      ref="triggerRef"
      :class="cn(
        'border-input flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]',
        size === 'default' && 'h-11',
        size === 'md' && 'h-9',
        size === 'sm' && 'h-8',
        invalid && 'border-destructive',
        disabled && 'cursor-not-allowed opacity-50',
        props.class,
      )"
      :aria-invalid="invalid"
      :aria-disabled="disabled"
      @click="toggleOpen"
    >
      <div class="flex flex-1 gap-1 min-w-0 items-center">
        <template v-if="multiple && selectedOptions.length > 0">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="option in selectedOptions"
              :key="option.value"
              class="text-xs text-secondary-foreground px-2 py-0.5 rounded-md bg-secondary inline-flex gap-1 items-center"
            >
              {{ option.label }}
              <button type="button" class="p-0.5 rounded-md hover:bg-secondary-foreground/20" @click.stop="selectOption(option)">
                <X class="size-3" />
              </button>
            </span>
          </div>
        </template>
        <template v-else>
          <span :class="cn('truncate', !displayValue && 'text-muted-foreground')">
            {{ displayValue || placeholder }}
          </span>
        </template>
      </div>
      <div class="flex gap-1 items-center">
        <button v-if="clearable && selectedValues.length > 0" type="button" class="p-1 rounded-md flex items-center justify-center hover:bg-secondary" @click="handleClear">
          <Icon name="ph:x" class="size-4" />
        </button>
        <Icon name="ph:caret-down" :class="cn('size-4 transition-transform', isOpen && 'rotate-180')" />
      </div>
    </div>

    <!-- Dropdown -->
    <Teleport v-if="isMounted" :to="teleportTarget">
      <div
        v-if="isOpen"
        ref="contentRef"
        :class="cn(
          'min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          isFlippedUp ? 'animate-slide-up' : 'animate-slide-down',
        )"
        :style="{
          position: isBodyTarget ? 'fixed' : 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: dynamicZIndex,
        }"
        @click.stop
      >
        <!-- Search -->
        <div v-if="searchable" class="mb-2 px-3 pb-2 border-b flex items-center">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="text-sm py-3 outline-none rounded-md bg-transparent h-8 w-full placeholder:text-muted-foreground"
            @input="handleSearch(searchQuery)"
            @click.stop
          >
        </div>

        <!-- Options -->
        <div
          :ref="!virtual ? '_containerRef' : undefined"
          :class="cn(!virtual && 'max-h-[200px] overflow-auto pb-1', virtual && 'relative')"
          @scroll="handleScroll"
          @click.stop
        >
          <!-- Non-virtual -->
          <template v-if="!virtual">
            <div
              v-for="(option, index) in displayOptions"
              :key="option.value"
              :data-option-index="index"
              :class="cn(
                'relative flex select-none items-center rounded-md px-2 py-1.5 text-sm outline-none cursor-pointer',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === index && 'bg-accent text-accent-foreground',
                isSelected(option) && 'bg-primary text-primary-foreground',
                option.disabled && 'pointer-events-none opacity-50',
              )"
              @click="handleOptionClick(option, $event)"
              @mousedown.prevent
            >
              <div class="flex flex-1 gap-2 items-center">
                <template v-if="(option.meta as { isCreatable?: boolean })?.isCreatable">
                  <Plus class="size-4" />
                </template>
                <span class="truncate">{{ option.label }}</span>
                <Check v-if="isSelected(option)" class="ml-auto size-4" />
              </div>
            </div>
          </template>

          <!-- Virtual -->
          <template v-else>
            <div v-bind="containerProps" class="pb-1 max-h-[200px] overflow-auto">
              <div v-bind="wrapperProps">
                <div
                  v-for="{ data: option, index } in virtualList"
                  :key="option.value"
                  :data-option-index="index"
                  :class="cn(
                    'relative flex select-none items-center rounded-md px-2 py-1.5 text-sm outline-none cursor-pointer',
                    'hover:bg-accent hover:text-accent-foreground',
                    highlightedIndex === index && 'bg-accent text-accent-foreground',
                    isSelected(option) && 'bg-primary text-primary-foreground',
                    option.disabled && 'pointer-events-none opacity-50',
                  )"
                  @click="handleOptionClick(option, $event)"
                  @mousedown.prevent
                >
                  <div class="flex flex-1 gap-2 items-center">
                    <template v-if="(option.meta as { isCreatable?: boolean })?.isCreatable">
                      <Plus class="size-4" />
                    </template>
                    <span class="truncate">{{ option.label }}</span>
                    <Check v-if="isSelected(option)" class="ml-auto size-4" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Loading / Empty -->
        <div v-if="isLoading" class="py-6 flex items-center justify-center">
          <slot name="loading">
            <div class="border-b-2 border-primary rounded-full h-4 w-4 animate-spin" />
          </slot>
        </div>
        <div v-else-if="displayOptions.length === 0" class="text-sm text-muted-foreground py-6 text-center">
          <slot name="empty">
            No options found.
          </slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="mt-2 pt-2 border-t">
          <slot name="footer" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
