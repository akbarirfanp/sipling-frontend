<!-- src/pages/index.vue -->
<script setup lang="ts">
const { loggedIn } = useUserSession()

if (loggedIn.value) {
  await navigateTo('/dashboard', { replace: true })
} else {
  await navigateTo('/auth/login', { replace: true })
}
</script>

<template>
  <div />
</template>