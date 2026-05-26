<script setup lang="ts">
import AppSidebar from '~/components/AppSidebar.vue'
</script>

<template>
  <CnSidebarProvider>
    <AppSidebar />
    <CnSidebarInset>
      <header class="flex shrink-0 gap-2 h-16 transition-[width,height] ease-linear items-center group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="px-4 flex gap-2 items-center">
          <CnSidebarTrigger class="-ml-1" />
          <CnSeparator orientation="vertical" class="mr-2 h-4" />
          <CnBreadcrumbProvider :options="{ autoGenerate: true }" />
        </div>
      </header>
      <div class="p-4 pt-0 flex flex-1 flex-col gap-4">
        <slot />
        <Footer />
      </div>
    </CnSidebarInset>
  </CnSidebarProvider>
</template>
