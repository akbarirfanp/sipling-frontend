<script setup lang="ts">
const isLoading = ref(true)

let timeoutId: NodeJS.Timeout | null = null

onMounted(async () => {
  await nextTick()

  timeoutId = setTimeout(() => {
    isLoading.value = false
  }, 500)
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<template>
  <CnSidebarProvider>
    <AppSidebar />
    <GenesysPanel />
    <CnSidebarInset>
      <MainNavbar />
      <main class="p-6 flex flex-1 flex-col gap-4">
        <!-- Breadcrumb Provider -->
        <div class="mb-2">
          <CnBreadcrumbProvider
            :options="{
              autoGenerate: true,
              useRouteName: true,
              showHome: false,
              maxItems: 5,
            }"
            class="text-sm"
          />
        </div>

        <slot />
        <Footer />
      </main>
    </CnSidebarInset>
  </CnSidebarProvider>
</template>
