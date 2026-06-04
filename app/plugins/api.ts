import { ofetch } from 'ofetch'

// Client HTTP untuk FE → BFF. Token JANGAN diinject di client.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const api = ofetch.create({
    baseURL: config.public.apiBase || '/api/proxy',
    onRequest({ options }) {
      const tenantId = useTenantId().value ?? ''
      if (options.headers instanceof Headers) {
        options.headers.set('X-Tenant-ID', tenantId)
      }
      else {
        options.headers = new Headers({
          ...(options.headers as Record<string, string> | undefined),
          'X-Tenant-ID': tenantId,
        })
      }
    },
    onResponseError({ response }) {
      const body = (response as any)?._data as ApiErrorResponse | undefined
      if (response.status === 401) {
        const router = useRouter()
        router.push('auth/login')
        return
      }

      throw createError({
        statusCode: response.status,
        statusMessage: (response as any)._data?.message || 'Request failed',
        data: body ?? { raw: (response as any)?._data },
      })
    },
  })
  return { provide: { api } }
})
