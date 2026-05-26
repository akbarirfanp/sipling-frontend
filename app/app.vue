<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import ConfirmDialogAlert from '~/components/ConfirmDialogAlert.vue'
import { appName } from '~/constants'
import 'vue-sonner/style.css'

useHead({
  title: appName,
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
  <ConfirmDialogAlert />
  <GlobalDialog />
</template>

<style>
html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}
</style>
