import type { Repos } from '@/plugins/repos'

declare module '#app' {
  interface NuxtApp {
    $api: typeof $fetch
    $repos: Repos
  }
}
export {}
