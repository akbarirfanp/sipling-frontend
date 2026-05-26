<script setup lang="ts">
import type { Component } from 'vue'
import { ref } from 'vue'
import { useSidebar } from './ui/sidebar'

const props = defineProps<{
  teams: {
    name: string
    logo: Component
    plan: string
  }[]
}>()

const { isMobile } = useSidebar()
const activeTeam = ref(props.teams[0])
</script>

<template>
  <CnSidebarMenu>
    <CnSidebarMenuItem>
      <CnDropdownMenu>
        <CnDropdownMenuTrigger as-child>
          <CnSidebarMenuButton
            size="lg"
            class="data-[state=open]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
          >
            <div class="text-sidebar-primary-foreground rounded-lg bg-sidebar-primary flex size-8 aspect-square items-center justify-center">
              <component :is="activeTeam?.logo" class="size-4" />
            </div>
            <div class="text-sm leading-tight text-left flex-1 grid">
              <span class="font-semibold truncate">
                {{ activeTeam?.name }}
              </span>
              <span class="text-xs truncate">{{ activeTeam?.plan }}</span>
            </div>
            <Icon name="ph:caret-up-down" class="ml-auto" />
          </CnSidebarMenuButton>
        </CnDropdownMenuTrigger>
        <CnDropdownMenuContent
          class="rounded-lg min-w-56 w-[--reka-dropdown-menu-trigger-width]"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <CnDropdownMenuLabel class="text-xs text-muted-foreground">
            Teams
          </CnDropdownMenuLabel>
          <CnDropdownMenuItem
            v-for="(team, index) in teams"
            :key="team.name"
            class="p-2 gap-2"
            @click="activeTeam = team"
          >
            <div class="border rounded-sm flex size-6 items-center justify-center">
              <component :is="team.logo" class="shrink-0 size-4" />
            </div>
            {{ team.name }}
            <CnDropdownMenuShortcut>⌘{{ index + 1 }}</CnDropdownMenuShortcut>
          </CnDropdownMenuItem>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuItem class="p-2 gap-2">
            <div class="border rounded-md bg-background flex size-6 items-center justify-center">
              <Icon name="ph:plus" class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">
              Add team
            </div>
          </CnDropdownMenuItem>
        </CnDropdownMenuContent>
      </CnDropdownMenu>
    </CnSidebarMenuItem>
  </CnSidebarMenu>
</template>
