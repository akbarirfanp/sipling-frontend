import process from 'node:process'
import { appDescription } from './app/constants/index'

export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    'shadcn-nuxt',
    'nuxt-auth-utils',
    'nuxt-authorization',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/test-utils/module',
    '@peterbud/nuxt-query',
  ],

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/nuxt.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: appDescription },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: 'white' },
        { name: 'color-scheme', content: 'light only' }
      ],
      script: [
        {
          src: 'https://app.sandbox.midtrans.com/snap/snap.js',
          'data-client-key': process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY,
          defer: false,
        }
      ],
    },
  },

  css: ['~/assets/css/index.css'],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  runtimeConfig: {
    apiGateway: process.env.NUXT_API_GATEWAY_URL,
    apiLoginPath: process.env.NUXT_AUTH_LOGIN_PATH || '/v1/auth/login',
    midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY,


    session: {
      password: process.env.NUXT_SESSION_PASSWORD!,
    },

    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || '/api/proxy',
      mock: process.env.NUXT_PUBLIC_MOCK === 'true',
      userServiceBase: process.env.NUXT_PUBLIC_USER_SERVICE_BASE || '/v1/user-svc',
      repoProvider:
        process.env.NUXT_PUBLIC_REPO_PROVIDER
        || (process.env.NUXT_PUBLIC_MOCK === 'true' ? 'mock' : 'rest'),

      // per-feature override (optional): isi 'rest' | 'mock' | 'gql'
      repoUsers: process.env.NUXT_PUBLIC_REPO_USERS,
      repoLeads: process.env.NUXT_PUBLIC_REPO_LEADS,

    },
  },

  // devServer: {
  //   port: app.devConfig.port,
  //   host: app.devConfig.host,
  // },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  compatibilityDate: '2024-08-14',

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    rollupConfig: {
      external: ['sharp'],
    },
  },

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },

  image: {
    domains: ['localhost', 'solutif.co.id'],
    ipx: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  nuxtQuery: {
    autoImports: ['useQuery', 'useMutation', 'useQueryClient'],
  },

  shadcn: {
    prefix: 'Cn',
  },
})

