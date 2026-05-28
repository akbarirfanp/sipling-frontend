import process from 'node:process'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    environmentOptions: {
      nuxt: {
        rootDir: process.cwd(),
        domEnvironment: 'happy-dom',
        mock: {
          intersectionObserver: true,
          indexedDb: true,
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '.nuxt/',
        'coverage/',
        '**/*.d.ts',
      ],
    },
  },
})
