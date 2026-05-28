<script setup lang="ts">
import type { Icon } from '#components'

defineProps<{
  items: {
    title: string
    url: string
    icon: string
  }[]
}>()

const route = useRoute()

function isActiveRoute(url: string) {
  if (url === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(url)
}
</script>

<template>
  <CnSidebarGroup>
    <CnSidebarMenu>
      <!-- <Collapsible v-for="item in items" :key="item.title" as-child class="group/collapsible"> -->
      <div v-for="item in items" :key="item.title">
        <CnSidebarMenuItem>
          <NuxtLink :href="item.url" class="flex items-center">
            <CnSidebarMenuButton
              :tooltip="item.title"
              :data-active="isActiveRoute(item.url)"
              class="cursor-pointer"
            >
              <Icon :name="item.icon" class="flex-shrink-0" />
              <span>{{ item.title }}</span>
            </CnSidebarMenuButton>
          </NuxtLink>
        </CnSidebarMenuItem>
      </div>
      <!-- </Collapsible> -->
    </CnSidebarMenu>
  </CnSidebarGroup>
</template>
