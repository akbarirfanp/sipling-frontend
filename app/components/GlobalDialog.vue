<script setup lang="ts">
import { useGlobalDialog } from '~/composables/useDialog'

const { currentDialog, isOpen, getSizeClasses } = useGlobalDialog()

// Handle escape key untuk close dialog
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && currentDialog.value && !currentDialog.value.options.persistent) {
    currentDialog.value.props.onClose?.()
  }
}

// Add/remove event listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <CnDialog :open="isOpen">
    <CnDialogContent
      v-if="currentDialog"
      :class="[
        getSizeClasses(currentDialog.options.size),
        currentDialog.options.contentClass,
      ]"
    >
      <!-- class="sm:max-w-lg" -->
      <!-- Dialog Header -->
      <CnDialogHeader v-if="currentDialog.options.title || currentDialog.options.description">
        <CnDialogTitle v-if="currentDialog.options.title">
          {{ currentDialog.options.title }}
        </CnDialogTitle>
        <CnDialogDescription v-if="currentDialog.options.description">
          {{ currentDialog.options.description }}
        </CnDialogDescription>
      </CnDialogHeader>

      <!-- Dynamic Component Content -->
      <div class="pb-4">
        <component
          :is="currentDialog.component"
          v-bind="currentDialog.props"
        />
      </div>
    </CnDialogContent>
  </CnDialog>
</template>
