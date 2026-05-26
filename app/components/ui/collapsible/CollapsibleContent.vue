<script setup lang="ts">
import type { CollapsibleContentProps } from 'reka-ui'
import { CollapsibleContent } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()
</script>

<template>
  <CollapsibleContent v-bind="props" class="transition-all overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
    <slot />
  </CollapsibleContent>
</template>
