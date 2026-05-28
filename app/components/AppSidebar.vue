<script setup lang="ts">
import NavMain from '@/components/NavMain.vue'
import { useSidebar } from './ui/sidebar'
import { useIsAdmin } from '~/composables/usePermissions'

const { isMobile } = useSidebar()
const isAdmin = useIsAdmin()

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'ph:squares-four-duotone',
    },
    {
      title: 'Manajemen Iuran',
      url: '/fees',
      icon: 'ph:users-four',
      adminOnly: true,
    },
    {
      title: 'Tagihan Iuran',
      url: '/bills',
      icon: 'ph:address-book-duotone',
    },
    {
      title: 'User Management',
      url: '/users',
      icon: 'ph:users-three-duotone',
      adminOnly: true,
    },
    {
      title: 'Laporan',
      url: '/laporan',
      icon: 'ph:clipboard-text-duotone',
      adminOnly: true,
    },
    {
      title: 'Riwayat Pembayaran',
      url: '/riwayat-pembayaran',
      icon: 'ph:money-duotone',
    },
  ],
}

const filteredNav = computed(() => {
  return data.navMain.filter((item: any) => {
    if (item.adminOnly && !isAdmin.value) return false
    return true
  })
})
</script>

<template>
  <CnSidebar v-bind="$props">
    <CnSidebarHeader class="border-b h-16 transition-all duration-200 relative">
      <NuxtImg src="/logo.webp" alt="Solutifcx" class="h-full w-full object-contain object-left" />
      <CnSidebarTrigger
        v-if="!isMobile"
        class="rounded-xs bg-gray-100 grid h-6 w-6 cursor-pointer translate-x-1/2 transition right-0 top-1/2 place-items-center absolute z-50 dark:bg-gray-800 hover:bg-gray-100 -translate-y-1/2 dark:hover:bg-gray-600"
      >
        <Icon name="ph:caret-up-down" :size="16" class="rotate-90" />
      </CnSidebarTrigger>
    </CnSidebarHeader>
    <CnSidebarContent>
      <NavMain :items="filteredNav" />
    </CnSidebarContent>
    <CnSidebarFooter />
    <CnSidebarRail />
  </CnSidebar>
</template>