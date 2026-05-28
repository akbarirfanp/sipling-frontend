import type { Ref } from 'vue'
import { useDebounceFn, useVirtualList } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

export interface UseScxSelectOptions {
  options?: ScxSelectOption[]
  modelValue?: Ref<string | string[]>
  multiple?: boolean
  creatable?: boolean
  async?: boolean
  virtual?: boolean
  searchable?: boolean
  filterFn?: ScxSelectFilterFn
  fetcher?: ScxSelectFetcher
  itemHeight?: number
  debounceMs?: number
}

export function useScxSelect(options: UseScxSelectOptions = {}) {
  const {
    options: initialOptions = [],
    modelValue = ref(options.multiple ? [] : '') as Ref<string | string[]>,
    multiple = false,
    creatable = false,
    async = false,
    virtual = false,
    searchable = true,
    filterFn,
    fetcher,
    itemHeight = 32,
    debounceMs = 300,
  } = options

  const isOpen = ref(false)
  const searchQuery = ref('')
  const loading = ref(false)
  const allOptions = ref<ScxSelectOption[]>([...initialOptions])
  const cursor = ref<string | undefined>()
  const hasMore = ref(!!async)
  const highlightedIndex = ref(-1)
  const containerRef = ref<HTMLElement>()
  const abortController = ref<AbortController | null>(null)

  const selectedValues = computed(() => {
    if (multiple) {
      return Array.isArray(modelValue.value) ? modelValue.value : []
    }
    return typeof modelValue.value === 'string' ? [modelValue.value] : []
  })

  const defaultFilterFn: ScxSelectFilterFn = (query, option) => {
    return option.label.toLowerCase().includes(query.toLowerCase())
  }

  const filteredOptions = computed(() => {
    if (async)
      return allOptions.value
    if (!searchable || !searchQuery.value)
      return allOptions.value

    const filter = filterFn || defaultFilterFn
    return allOptions.value.filter(option => filter(searchQuery.value, option))
  })

  const canCreate = computed(() => {
    if (!creatable || !searchQuery.value)
      return false
    return !filteredOptions.value.some(option =>
      option.value.toLowerCase() === searchQuery.value.toLowerCase(),
    )
  })

  const displayOptions = computed(() => {
    const options = [...filteredOptions.value]
    if (canCreate.value) {
      options.unshift({
        label: `Create "${searchQuery.value}"`,
        value: searchQuery.value,
        meta: { isCreatable: true },
      })
    }
    return options
  })

  const { list: virtualList, containerProps, wrapperProps } = useVirtualList(
    displayOptions,
    {
      itemHeight,
      overscan: 5,
    },
  )

  // Use the containerRef from useVirtualList for virtual mode
  if (virtual) {
    containerRef.value = containerProps.ref.value || undefined
    watch(containerProps.ref, (newRef) => {
      containerRef.value = newRef || undefined
    })
  }

  const debouncedFetch = useDebounceFn(async (query: string, reset = false) => {
    if (!async || !fetcher)
      return

    if (abortController.value) {
      abortController.value.abort()
    }

    abortController.value = new AbortController()
    loading.value = true

    try {
      const result = await fetcher(query, reset ? undefined : cursor.value)

      if (reset) {
        // Preserve selected options that might not be in new results
        const selectedOptions = allOptions.value.filter(option =>
          selectedValues.value.includes(option.value),
        )
        // Deduplicate all items by value
        const existingValues = new Set(selectedOptions.map(opt => opt.value))
        const newOptions = result.items.filter(item =>
          !existingValues.has(item.value),
        )
        allOptions.value = [...selectedOptions, ...newOptions]
      }
      else {
        // Deduplicate when appending
        const existingValues = new Set(allOptions.value.map(opt => opt.value))
        const newOptions = result.items.filter(item =>
          !existingValues.has(item.value),
        )
        allOptions.value.push(...newOptions)
      }

      cursor.value = result.nextCursor
      hasMore.value = result.hasMore ?? !!result.nextCursor
    }
    catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('ScxSelect fetch error:', error)
      }
    }
    finally {
      loading.value = false
      abortController.value = null
    }
  }, debounceMs)

  const isSelected = (option: ScxSelectOption) => {
    return selectedValues.value.includes(option.value)
  }

  const selectOption = (option: ScxSelectOption) => {
    if (option.disabled)
      return

    if ((option.meta as { isCreatable?: boolean })?.isCreatable) {
      const newOption = { label: option.value, value: option.value }
      allOptions.value.push(newOption)
      searchQuery.value = ''
      selectOption(newOption)
      return
    }

    if (multiple) {
      const currentValues = Array.isArray(modelValue.value) ? [...modelValue.value] : []
      const index = currentValues.indexOf(option.value)

      if (index > -1) {
        currentValues.splice(index, 1)
      }
      else {
        currentValues.push(option.value)
      }

      modelValue.value = currentValues
    }
    else {
      modelValue.value = option.value
      isOpen.value = false
    }
  }

  const clearSelection = () => {
    modelValue.value = multiple ? [] : ''
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isOpen.value)
      return

    const optionsCount = displayOptions.value.length

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, optionsCount - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
        break
      case 'Enter': {
        event.preventDefault()
        const option = displayOptions.value[highlightedIndex.value]
        if (highlightedIndex.value >= 0 && option) {
          selectOption(option)
        }
        break
      }
      case 'Escape':
        isOpen.value = false
        break
    }
  }

  const loadMore = async () => {
    if (!async || !hasMore.value || loading.value)
      return
    await debouncedFetch(searchQuery.value, false)
  }

  watch(searchQuery, (newQuery) => {
    if (async) {
      debouncedFetch(newQuery, true)
    }
    highlightedIndex.value = -1
  })

  const immediatelyFetch = async (query: string, reset = false) => {
    if (!async || !fetcher)
      return

    if (abortController.value) {
      abortController.value.abort()
    }

    abortController.value = new AbortController()
    loading.value = true

    try {
      const result = await fetcher(query, reset ? undefined : cursor.value)

      if (reset) {
        const selectedOptions = allOptions.value.filter(option =>
          selectedValues.value.includes(option.value),
        )
        const existingValues = new Set(selectedOptions.map(opt => opt.value))
        const newOptions = result.items.filter(item =>
          !existingValues.has(item.value),
        )
        allOptions.value = [...selectedOptions, ...newOptions]
      }
      else {
        const existingValues = new Set(allOptions.value.map(opt => opt.value))
        const newOptions = result.items.filter(item =>
          !existingValues.has(item.value),
        )
        allOptions.value.push(...newOptions)
      }

      cursor.value = result.nextCursor
      hasMore.value = result.hasMore ?? !!result.nextCursor
    }
    catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('ScxSelect fetch error:', error)
      }
    }
    finally {
      loading.value = false
      abortController.value = null
    }
  }

  watch(isOpen, (open) => {
    if (open) {
      highlightedIndex.value = -1
      if (async && !allOptions.value.length) {
        // Load initial data immediately without debounce
        immediatelyFetch('', true)
      }
    }
    else {
      if (!async) {
        searchQuery.value = ''
      }
    }
  })

  // Auto-scroll highlighted item into view
  watch(highlightedIndex, async (newIndex) => {
    if (newIndex >= 0 && containerRef.value) {
      await nextTick()
      const container = containerRef.value
      const items = container.querySelectorAll('[data-option-index]')
      const targetItem = items[newIndex] as HTMLElement

      if (targetItem) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = targetItem.getBoundingClientRect()

        if (itemRect.bottom > containerRect.bottom) {
          // Scroll down
          container.scrollTop += itemRect.bottom - containerRect.bottom + 4
        }
        else if (itemRect.top < containerRect.top) {
          // Scroll up
          container.scrollTop -= containerRect.top - itemRect.top + 4
        }
      }
    }
  })

  return {
    isOpen,
    searchQuery,
    loading,
    allOptions,
    filteredOptions,
    displayOptions,
    selectedValues,
    highlightedIndex,
    containerRef,
    canCreate,
    hasMore,
    ...(virtual
      ? {
          virtualList,
          containerProps,
          wrapperProps,
        }
      : {}),
    isSelected,
    selectOption,
    clearSelection,
    handleKeydown,
    loadMore,
  }
}
