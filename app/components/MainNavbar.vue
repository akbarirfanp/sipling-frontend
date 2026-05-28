<script setup lang="ts">
import { useAuth } from '~/features/auth/app/useAuth'
import { useSidebar } from './ui/sidebar'

const { isMobile } = useSidebar()
const { logout } = useAuth()
const { user } = useUserSession()
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

async function handleLogout() {
  await logout()
}

const nickname = computed(() => (user.value?.name || 'User')
  .split(' ')
  .filter(Boolean)
  .map(word => word?.[0]?.toUpperCase())
  .join(''))
</script>

<template>
  <header class="px-4 border-b bg-background flex shrink-0 gap-2 h-16 items-center top-0 sticky z-1">
    <CnSidebarTrigger v-if="isMobile" class="-ml-1">
      <Icon name="ph:list" size="24" />
    </CnSidebarTrigger>
    <div class="ml-auto flex gap-2 items-center">
      <div v-if="isLoading" class="flex gap-2 items-center">
        <CnSkeleton class="rounded-full h-8 w-8" />
        <div>
          <CnSkeleton class="mb-1 h-4 w-16" />
          <CnSkeleton class="h-3 w-24" />
        </div>
      </div>
      <CnDropdownMenu v-else>
        <CnDropdownMenuTrigger class="flex gap-2 cursor-pointer items-center">
          <CnAvatar class="size-10">
            <CnAvatarFallback class="bg-primary/60">
              {{ nickname }}
            </CnAvatarFallback>
          </CnAvatar>
          <div class="text-left">
            <p class="text-sm font-medium">
              {{ user?.name || 'User' }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ user?.email || 'user@example.com' }}
            </p>
          </div>
          <Icon name="ph:caret-down" />
        </CnDropdownMenuTrigger>
        <CnDropdownMenuContent align="end">
          <CnDropdownMenuLabel>My Account</CnDropdownMenuLabel>
          <CnDropdownMenuSeparator />
          <CnDropdownMenuItem class="w-full cursor-pointer" :disabled="isLoading" as="button" @click="handleLogout">
            Logout
          </CnDropdownMenuItem>
        </CnDropdownMenuContent>
      </CnDropdownMenu>
    </div>
  </header>
</template>
