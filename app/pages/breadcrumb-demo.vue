<script setup lang="ts">
// Meta untuk halaman ini
definePageMeta({
  breadcrumbLabel: 'Breadcrumb Demo',
  breadcrumbIcon: '🍞',
})

// Composable usage
const { breadcrumbItems, setBreadcrumbs, clearBreadcrumbs } = useBreadcrumb()

// Manual breadcrumb items
const manualItems: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Components', to: '/components' },
  { label: 'Breadcrumb', active: true },
]

// Items with icons
const itemsWithIcons: BreadcrumbItem[] = [
  { label: 'Home', to: '/', icon: 'ph:house' },
  { label: 'UI Components', to: '/components', icon: 'ph:squares-four' },
  { label: 'Navigation', to: '/components/navigation', icon: 'ph:compass' },
  { label: 'Breadcrumb', active: true, icon: 'ph:list' },
]

// Long breadcrumb for ellipsis demo
const longBreadcrumbItems: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Level 1', to: '/level1' },
  { label: 'Level 2', to: '/level1/level2' },
  { label: 'Level 3', to: '/level1/level2/level3' },
  { label: 'Level 4', to: '/level1/level2/level3/level4' },
  { label: 'Level 5', to: '/level1/level2/level3/level4/level5' },
  { label: 'Current Page', active: true },
]

// Interactive demo configuration
const demoConfig = ref({
  maxItems: 4,
  separator: '/',
  showHome: true,
  autoGenerate: true,
})

// Breadcrumb state untuk debugging
const breadcrumbState = computed(() => ({
  itemsCount: breadcrumbItems.value.length,
  activeItem: breadcrumbItems.value.find((item: BreadcrumbItem) => item.active)?.label,
  isManual: breadcrumbItems.value.length > 0,
}))

// Methods untuk interactive demo
function addCustomItem() {
  const customItems: BreadcrumbItem[] = [
    { label: 'Home', to: '/' },
    { label: 'Custom Section', to: '/custom' },
    { label: 'Dynamic Item', active: true },
  ]
  setBreadcrumbs(customItems)
}

function clearBreadcrumb() {
  clearBreadcrumbs()
}

function resetBreadcrumb() {
  // Reset ke auto mode dengan clear manual items
  clearBreadcrumbs()
}

// SEO
useHead({
  title: 'Breadcrumb Demo - Custom Components',
  meta: [
    {
      name: 'description',
      content: 'Demo dan showcase untuk custom breadcrumb component dengan berbagai konfigurasi dan use cases.',
    },
  ],
})
</script>

<template>
  <div class="mx-auto p-6 container space-y-8">
    <div class="space-y-4">
      <h1 class="text-3xl font-bold">
        Breadcrumb Demo
      </h1>
      <p class="text-muted-foreground">
        Showcase custom breadcrumb component dengan berbagai konfigurasi dan use cases.
      </p>
    </div>

    <!-- Basic Usage -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Basic Usage
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider />
      </div>
      <div class="text-sm text-muted-foreground">
        Auto-generated dari current route
      </div>
    </section>

    <!-- Manual Items -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Manual Items
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider :items="manualItems" />
      </div>
      <div class="text-sm text-muted-foreground">
        Custom breadcrumb items yang didefinisikan manual
      </div>
    </section>

    <!-- With Icons -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        With Icons
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider :items="itemsWithIcons" />
      </div>
      <div class="text-sm text-muted-foreground">
        Breadcrumb dengan icons untuk visual enhancement
      </div>
    </section>

    <!-- Custom Separator -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Custom Separator
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider
          :items="manualItems"
          :options="{ separator: '→' }"
        />
      </div>
      <div class="text-sm text-muted-foreground">
        Custom separator character
      </div>
    </section>

    <!-- Responsive with Ellipsis -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Responsive with Ellipsis
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider
          :items="longBreadcrumbItems"
          :responsive="true"
        />
      </div>
      <div class="text-sm text-muted-foreground">
        Long breadcrumb dengan ellipsis untuk responsive display
      </div>
    </section>

    <!-- Auto Generation -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Auto Generation
      </h2>
      <div class="p-4 border rounded-lg">
        <CnBreadcrumbProvider :options="{ autoGenerate: true }" />
        <p class="text-sm text-muted-foreground mt-2">
          Auto-generated dari current route
        </p>
      </div>
    </section>

    <!-- Interactive Demo -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Interactive Demo
      </h2>

      <div class="gap-4 grid md:grid-cols-2">
        <div class="space-y-4">
          <h3 class="font-medium">
            Configuration
          </h3>

          <div class="space-y-2">
            <label class="text-sm font-medium">Max Items</label>
            <input
              v-model.number="demoConfig.maxItems"
              type="number"
              min="2"
              max="10"
              class="px-3 py-2 border rounded-md w-full"
            >
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Separator</label>
            <input
              v-model="demoConfig.separator"
              type="text"
              class="px-3 py-2 border rounded-md w-full"
            >
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="showHome"
              v-model="demoConfig.showHome"
              type="checkbox"
            >
            <label for="showHome" class="text-sm font-medium">
              Show Home
            </label>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="autoGenerate"
              v-model="demoConfig.autoGenerate"
              type="checkbox"
            >
            <label for="autoGenerate" class="text-sm font-medium">
              Auto Generate
            </label>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="font-medium">
            Result
          </h3>
          <div class="p-4 border rounded-lg flex min-h-[100px] items-center">
            <CnBreadcrumbProvider
              :options="{
                maxItems: demoConfig.maxItems,
                separator: demoConfig.separator,
                showHome: demoConfig.showHome,
                autoGenerate: demoConfig.autoGenerate,
              }"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Composable Usage -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Composable Usage
      </h2>

      <div class="p-4 border rounded-lg space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            class="text-sm text-white px-3 py-1 rounded bg-blue-500 hover:bg-blue-600"
            @click="addCustomItem"
          >
            Add Custom Item
          </button>
          <button
            class="text-sm text-white px-3 py-1 rounded bg-red-500 hover:bg-red-600"
            @click="clearBreadcrumb"
          >
            Clear Breadcrumb
          </button>
          <button
            class="text-sm text-white px-3 py-1 rounded bg-gray-500 hover:bg-gray-600"
            @click="resetBreadcrumb"
          >
            Reset to Auto
          </button>
        </div>

        <CnBreadcrumbProvider />

        <div class="text-sm text-muted-foreground">
          Breadcrumb state: {{ breadcrumbState }}
        </div>
      </div>
    </section>

    <!-- Navigation Demo -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Navigation Demo
      </h2>

      <div class="p-4 border rounded-lg space-y-4">
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            to="/"
            class="text-sm text-white px-3 py-1 rounded bg-green-500 hover:bg-green-600"
          >
            Go to Home
          </NuxtLink>
          <NuxtLink
            to="/dashboard"
            class="text-sm text-white px-3 py-1 rounded bg-green-500 hover:bg-green-600"
          >
            Go to Dashboard
          </NuxtLink>
          <NuxtLink
            to="/breadcrumb-demo"
            class="text-sm text-white px-3 py-1 rounded bg-green-500 hover:bg-green-600"
          >
            Stay Here
          </NuxtLink>
        </div>

        <CnBreadcrumbProvider />

        <div class="text-sm text-muted-foreground">
          Navigate ke halaman lain untuk lihat breadcrumb changes
        </div>
      </div>
    </section>
  </div>
</template>
