<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'

defineProps<{
  projects: {
    name: string
    url: string
    icon: any
  }[]
}>()

const { isMobile } = useSidebar()
</script>

<template>
  <CnSidebarGroup class="group-data-[collapsible=icon]:hidden">
    <CnSidebarGroupLabel>Projects</CnSidebarGroupLabel>
    <CnSidebarMenu>
      <CnSidebarMenuItem v-for="item in projects" :key="item.name">
        <CnSidebarMenuButton as-child>
          <a :href="item.url">
            <component :is="item.icon" />
            <span>{{ item.name }}</span>
          </a>
        </CnSidebarMenuButton>
        <CnDropdownMenu>
          <CnDropdownMenuTrigger as-child>
            <CnSidebarMenuAction show-on-hover>
              <Icon name="ph:dots-three" />
              <span class="sr-only">More</span>
            </CnSidebarMenuAction>
          </CnDropdownMenuTrigger>
          <CnDropdownMenuContent
            class="rounded-lg w-48"
            :side="isMobile ? 'bottom' : 'right'"
            :align="isMobile ? 'end' : 'start'"
          >
            <CnDropdownMenuItem>
              <Icon name="ph:folder" class="text-muted-foreground" />
              <span>View Project</span>
            </CnDropdownMenuItem>
            <CnDropdownMenuItem>
              <Icon name="ph:arrow-right" class="text-muted-foreground" />
              <span>Share Project</span>
            </CnDropdownMenuItem>
            <CnDropdownMenuSeparator />
            <CnDropdownMenuItem>
              <Icon name="ph:trash" class="text-muted-foreground" />
              <span>Delete Project</span>
            </CnDropdownMenuItem>
          </CnDropdownMenuContent>
        </CnDropdownMenu>
      </CnSidebarMenuItem>
      <CnSidebarMenuItem>
        <CnSidebarMenuButton class="text-sidebar-foreground/70">
          <Icon name="ph:dots-three" class="text-sidebar-foreground/70" />
          <span>More</span>
        </CnSidebarMenuButton>
      </CnSidebarMenuItem>
    </CnSidebarMenu>
  </CnSidebarGroup>
</template>
