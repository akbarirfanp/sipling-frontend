<script setup lang="ts">
interface AutocompleteItem {
  value: any
  text: string
  [key: string]: any
}

interface Props {
  modelValue?: any
  items: AutocompleteItem[]
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  searchable?: boolean
  itemValue?: string
  itemText?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'select', item: AutocompleteItem): void
  (e: 'remove', item: AutocompleteItem): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Choose...',
  multiple: false,
  disabled: false,
  searchable: true,
  itemValue: 'value',
  itemText: 'text',
})

const emit = defineEmits<Emits>()

// Refs
const inputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)

// Computed properties
const selectedItems = computed(() => {
  if (!props.multiple) {
    return props.modelValue ? [props.modelValue] : []
  }
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

const filteredItems = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.items
  }

  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item =>
    getItemText(item).toLowerCase().includes(query),
  )
})

// Helper functions
function getItemValue(item: AutocompleteItem) {
  return typeof item === 'object' ? item[props.itemValue] : item
}

function getItemText(item: AutocompleteItem) {
  return typeof item === 'object' ? item[props.itemText] : String(item)
}

function isItemSelected(item: AutocompleteItem) {
  const itemValue = getItemValue(item)
  if (props.multiple) {
    return selectedItems.value.some(selected => getItemValue(selected) === itemValue)
  }
  return props.modelValue && getItemValue(props.modelValue) === itemValue
}

// Event handlers
function handleFocus() {
  showDropdown.value = true
  highlightedIndex.value = -1
}

function handleBlur() {
  // Delay hiding dropdown to allow for item selection
  setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
  }, 150)
}

function handleInput() {
  if (!showDropdown.value) {
    showDropdown.value = true
  }
  highlightedIndex.value = -1
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (highlightedIndex.value < filteredItems.value.length - 1) {
        highlightedIndex.value++
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--
      }
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredItems.value.length) {
        const selectedItem = filteredItems.value[highlightedIndex.value]
        if (selectedItem) {
          selectItem(selectedItem)
        }
      }
      break
    case 'Escape':
      showDropdown.value = false
      inputRef.value?.blur()
      break
  }
}

function selectItem(item: AutocompleteItem) {
  if (props.multiple) {
    const currentSelection = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const itemValue = getItemValue(item)
    const existingIndex = currentSelection.findIndex(selected => getItemValue(selected) === itemValue)

    if (existingIndex >= 0) {
      // Remove item if already selected
      currentSelection.splice(existingIndex, 1)
      emit('remove', item)
    }
    else {
      // Add item if not selected
      currentSelection.push(item)
      emit('select', item)
    }

    emit('update:modelValue', currentSelection)
  }
  else {
    emit('update:modelValue', item)
    emit('select', item)
    searchQuery.value = getItemText(item)
    showDropdown.value = false
  }
}

function removeItem(item: AutocompleteItem) {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const itemValue = getItemValue(item)
    const newSelection = props.modelValue.filter(selected => getItemValue(selected) !== itemValue)
    emit('update:modelValue', newSelection)
    emit('remove', item)
  }
}

function clearSelection() {
  searchQuery.value = ''
  if (props.multiple) {
    emit('update:modelValue', [])
  }
  else {
    emit('update:modelValue', null)
  }
  inputRef.value?.focus()
}

// Watch for external model value changes
watch(() => props.modelValue, (newValue) => {
  if (!props.multiple && newValue) {
    searchQuery.value = getItemText(newValue)
  }
  else if (!props.multiple) {
    searchQuery.value = ''
  }
}, { immediate: true })

// Click outside to close dropdown
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!inputRef.value?.contains(target)) {
      showDropdown.value = false
    }
  })
})
</script>

<template>
  <div class="relative">
    <!-- Input Field -->
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="px-3 py-2 border border-gray-300 rounded-md w-full shadow-sm disabled:text-gray-500 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      >

      <!-- Clear Button -->
      <button
        v-if="searchQuery && !disabled"
        type="button"
        class="text-gray-400 right-2 top-1/2 absolute hover:text-gray-600 -translate-y-1/2"
        @click="clearSelection"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Selected Items (for multiple selection) -->
    <div v-if="multiple && selectedItems.length > 0" class="mt-2 flex flex-wrap gap-1">
      <span
        v-for="item in selectedItems"
        :key="getItemValue(item)"
        class="text-xs text-blue-800 font-medium px-2 py-1 rounded-full bg-blue-100 inline-flex items-center"
      >
        {{ getItemText(item) }}
        <button
          type="button"
          class="text-blue-600 ml-1 hover:text-blue-800"
          @click="removeItem(item)"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>

    <!-- Dropdown List -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-show="showDropdown && filteredItems.length > 0"
        class="mt-1 border border-gray-300 rounded-md bg-white max-h-60 w-full shadow-lg absolute z-50 overflow-auto"
      >
        <ul class="py-1">
          <li
            v-for="(item, index) in filteredItems"
            :key="getItemValue(item)"
            class="text-sm px-3 py-2 cursor-pointer" :class="[
              {
                'bg-blue-50 text-blue-900': index === highlightedIndex,
                'text-gray-900 hover:bg-gray-50': index !== highlightedIndex,
                'bg-blue-100 text-blue-900': isItemSelected(item) && index !== highlightedIndex,
              },
            ]"
            @click="selectItem(item)"
            @mouseenter="highlightedIndex = index"
          >
            <div class="flex items-center justify-between">
              <span>{{ getItemText(item) }}</span>
              <svg
                v-if="isItemSelected(item)"
                class="text-blue-600 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- No results message -->
    <div
      v-show="showDropdown && filteredItems.length === 0 && searchQuery"
      class="mt-1 border border-gray-300 rounded-md bg-white w-full shadow-lg absolute z-50"
    >
      <div class="text-sm text-gray-500 px-3 py-2">
        No results found for "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>
