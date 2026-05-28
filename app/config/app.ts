import process from 'node:process'

export const app = {
  devConfig: {
    port: Number(process.env.NUXT_PORT) || 3000,
    host: process.env.NUXT_HOST || 'localhost',
  },
  session: {
    maxAge: {
      default: 60 * 60 * 24 * 7,
      rememberMe: 60 * 60 * 24 * 30,
    },
  },
  apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:9804/api/v1',
  apiTimeout: process.env.NUXT_PUBLIC_API_TIMEOUT || '10000',
  appName: process.env.NUXT_PUBLIC_APP_NAME || 'CRM Multi-Tenant',
}
