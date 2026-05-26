<script setup lang="ts">
const { isOpen, options, resolveConfirm } = useConfirmDialog()

const iconConfig = computed(() => {
  if (options.value.icon) {
    return {
      bg: 'bg-yellow-100',
      color: 'text-yellow-500',
      component: options.value.icon,
    }
  }

  switch (options.value.type) {
    case 'success':
      return {
        bg: 'bg-green-100',
        color: 'text-green-500',
        component: 'ph:check-circle',
      }
    case 'error':
      return {
        bg: 'bg-red-100',
        src: '/failed.png',
        alt: 'Failed',
        class: 'w-12 h-12',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-100',
        color: 'text-yellow-500',
        component: 'ph:warning-circle',
      }
    case 'confirmation':
    default:
      return {
        bg: 'bg-yellow-100',
        color: 'text-yellow-500',
        component: 'ph:info',
      }
  }
})

const showCancelButton = computed(() => {
  return options.value.type === 'confirmation'
})
</script>

<template>
  <CnAlertDialog v-model:open="isOpen">
    <CnAlertDialogContent class="p-6 text-center rounded-sm gap-1 w-[448px]">
      <div class="mb-4 flex justify-center">
        <div
          class="rounded-full flex h-12 w-12 items-center justify-center"
          :class="iconConfig.bg"
        >
          <img
            v-if="iconConfig.src"
            :src="iconConfig.src"
            :alt="iconConfig.alt"
            :class="iconConfig.class"
          >
          <Icon
            v-if="iconConfig.component"
            :name="iconConfig.component"
            size="32"
            :class="iconConfig.color"
          />
        </div>
      </div>

      <CnAlertDialogHeader class="space-y-2">
        <CnAlertDialogTitle class="text-[20px] font-semibold text-center">
          {{ options.title }}
        </CnAlertDialogTitle>
        <CnAlertDialogDescription class="text-[14px] text-gray-500 text-center whitespace-pre-line">
          {{ options.message }}
        </CnAlertDialogDescription>
      </CnAlertDialogHeader>

      <div class="mt-4 border-t border-gray-200 w-full" />

      <CnAlertDialogFooter class="mt-3 flex justify-center" :class="{ 'gap-3': showCancelButton }">
        <template v-if="showCancelButton">
          <CnAlertDialogCancel
            class="flex-1 h-11"
            @click="resolveConfirm(false)"
          >
            {{ options.cancelText }}
          </CnAlertDialogCancel>
          <CnAlertDialogAction
            class="flex-1 h-11"
            @click="resolveConfirm(true)"
          >
            {{ options.confirmText }}
          </CnAlertDialogAction>
        </template>
        <template v-else>
          <CnAlertDialogAction
            class="flex-1 h-11"
            @click="resolveConfirm(true)"
          >
            {{ options.confirmText }}
          </CnAlertDialogAction>
        </template>
      </CnAlertDialogFooter>
    </CnAlertDialogContent>
  </CnAlertDialog>
</template>
