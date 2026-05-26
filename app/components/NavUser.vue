<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'

const _props = defineProps<{
  user: {
    name: string
    email: string
    avatar: string
  }
}>()

const { isMobile } = useSidebar()
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
            <CnAvatar class="rounded-lg h-8 w-8">
              <CnAvatarImage :src="user.avatar" :alt="user.name" />
              <CnAvatarFallback class="rounded-lg">
                CN
              </CnAvatarFallback>
            </CnAvatar>
            <div class="text-sm leading-tight text-left flex-1 grid">
              <span class="font-semibold truncate">{{ user.name }}</span>
              <span class="text-xs truncate">{{ user.email }}</span>
            </div>
            <Icon name="ph:caret-up-down" class="ml-auto size-4" />
          </CnSidebarMenuButton>
        </CnDropdownMenuTrigger>
        <CnDropdownMenuContent
          class="rounded-lg min-w-56 w-[--reka-dropdown-menu-trigger-width]"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <CnDropdownMenuLabel class="font-normal p-0">
            <div class="text-sm px-1 py-1.5 text-left flex gap-2 items-center">
              <CnAvatar class="rounded-lg h-8 w-8">
                <CnAvatarImage :src="user.avatar" :alt="user.name" />
                <CnAvatarFallback class="rounded-lg">
                  CN
                </CnAvatarFallback>
              </CnAvatar>
              <div class="text-sm leading-tight text-left flex-1 grid">
                <span class="font-semibold truncate">{{ user.name }}</span>
                <span class="text-xs truncate">{{ user.email }}</span>
              </div>
            </div>
          </CnDropdownMenuLabel>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuGroup>
            <CnDropdownMenuItem>
              <Icon name="ph:sparkle" />
              Upgrade to Pro
            </CnDropdownMenuItem>
          </CnDropdownMenuGroup>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuGroup>
            <CnDropdownMenuItem>
              <Icon name="ph:shield-check" />
              Account
            </CnDropdownMenuItem>
            <CnDropdownMenuItem>
              <Icon name="ph:credit-card" />
              Billing
            </CnDropdownMenuItem>
            <CnDropdownMenuItem>
              <Icon name="ph:bell" />
              Notifications
            </CnDropdownMenuItem>
          </CnDropdownMenuGroup>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuItem>
            <Icon name="ph:sign-out" />
            Log out
          </CnDropdownMenuItem>
        </CnDropdownMenuContent>
      </CnDropdownMenu>
    </CnSidebarMenuItem>
  </CnSidebarMenu>
</template>
