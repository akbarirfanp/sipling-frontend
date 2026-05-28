import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
      timeouts: {
        failure: 10000, // 10 seconds timeout for failure
      },
    }),
    presetAnimations(),
    presetShadcn(
      {
        color: {
          base: 'green',

          light: {
            primary: '120 55% 32%',
            'primary-foreground': '0 0% 98%',

            background: '0 0% 100%',

            'sidebar-primary': '158 64% 40%',
            'sidebar-primary-foreground': '0 0% 98%',
          },

          dark: {
            primary: '158 64% 40%',
            'primary-foreground': '0 0% 98%',

            background: '0 0% 12%',

            'sidebar-primary': '158 64% 40%',
            'sidebar-primary-foreground': '0 0% 98%',
          },
        },
      },
      {
        componentLibrary: 'reka',
      },
    )
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        '(components|app)/**/*.{js,ts,vue}',
      ],
    },
  },
  theme: {
    extend: {
      spacing: {
        4: '1rem',
      },
      colors: {
        // 'red-pigment': {
        //   // Tints (lighter versions)
        //   'tints-12': 'hsl(357, 82%, 58%)', // #ef373f
        //   'tints-25': 'hsl(356, 80%, 64%)', // #f1545a
        //   'tints-37': 'hsl(355, 78%, 70%)', // #f37076
        //   'tints-50': 'hsl(354, 76%, 76%)', // #f68d91
        //   'tints-62': 'hsl(353, 74%, 82%)', // #f8a9ac
        //   'tints-75': 'hsl(352, 72%, 88%)', // #fac6c8
        //   'tints-87': 'hsl(351, 70%, 94%)', // #fce2e3

        //   // Base color
        //   'base': 'hsl(358, 85%, 52%)', // #ED1B24

        //   // Shades (darker versions)
        //   'shades-12': 'hsl(358, 77%, 45%)', // #cf171f
        //   'shades-25': 'hsl(358, 78%, 39%)', // #b1141b
        //   'shades-37': 'hsl(358, 79%, 32%)', // #941016
        //   'shades-50': 'hsl(358, 80%, 26%)', // #760d12
        //   'shades-62': 'hsl(358, 81%, 19%)', // #580a0d
        //   'shades-75': 'hsl(358, 82%, 13%)', // #3b0609
        //   'shades-87': 'hsl(358, 83%, 6%)', // #1d0304
        // },
        // sidebar: {
        //   'DEFAULT': 'hsl(var(--sidebar-background))',
        //   'foreground': 'hsl(var(--sidebar-foreground))',
        //   'primary': 'hsl(var(--sidebar-primary))',
        //   'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
        //   'accent': 'hsl(var(--sidebar-accent))',
        //   'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        //   'border': 'hsl(var(--sidebar-border))',
        //   'ring': 'hsl(var(--sidebar-ring))',
        // },
      },
    },
  },
})
