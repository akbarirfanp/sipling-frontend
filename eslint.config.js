// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    unocss: true,
    formatters: true,
    pnpm: true,
  },
  {
    rules: {
      'camelcase': ['warn', {
        properties: 'always',
        ignoreDestructuring: false,
        ignoreImports: false,
        ignoreGlobals: true,
      }],
      'ts/no-explicit-any': 'warn',
      'ts/consistent-type-assertions': ['warn', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow-as-parameter',
      }],
    },
  },
  {
    // Allow `as any` in test files
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*'],
    rules: {
      'ts/no-explicit-any': 'warn',
      'camelcase': 'off',
    },
  },
  {
    // Allow `as any` in validation utilities (Zod internals)
    files: ['**/lib/validations/**/*.ts', '**/utils/provider.ts'],
    rules: {
      'ts/no-explicit-any': 'off',
    },
  },
)
  .append(nuxt())
