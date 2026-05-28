<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'

const props = withDefaults(defineProps<DialogRootProps & {
  title?: string
  description?: string
}>(), {
  title: 'Command Palette',
  description: 'Search for a command to run...',
})
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CnDialog v-bind="forwarded">
    <CnDialogContent class="p-0 overflow-hidden">
      <CnDialogHeader class="sr-only">
        <CnDialogTitle>{{ title }}</CnDialogTitle>
        <CnDialogDescription>{{ description }}</CnDialogDescription>
      </CnDialogHeader>
      <CnCommand>
        <slot />
      </CnCommand>
    </CnDialogContent>
  </CnDialog>
</template>
