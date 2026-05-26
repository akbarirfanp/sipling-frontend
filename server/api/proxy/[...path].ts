import { getRequestHeader, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  // base upstream tanpa trailing slash
  const upstreamBase = (useRuntimeConfig(event).apiGateway || '').replace(/\/+$/, '')

  // catch-all param bisa STRING atau ARRAY → normalisasi aman
  const raw = getRouterParam(event, 'path') // "v1/user-svc/users" atau undefined
  const normalizedPath = raw ? String(raw).replace(/^\/+/, '') : ''
  const url = normalizedPath ? `${upstreamBase}/${normalizedPath}` : upstreamBase

  const method = event.method.toUpperCase()

  // query → snake_case
  const query = toSnake(getQuery(event))

  // body → snake_case hanya utk JSON (biar ngak bentrok multipart/stream)
  let body: any
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const ctype = getRequestHeader(event, 'content-type') || ''
    if (ctype.includes('application/json') || !ctype) {
      body = toSnake(await readBody(event))
    }
    else {
      body = await readBody(event) // pass-through
    }
  }

  // ambil token dari session
  const session = await getUserSession(event)
  const accessToken = session?.accessToken || ''

  // tenant dari header atau fallback cookie
  const tenantId
    = getRequestHeader(event, 'x-tenant-id')
      || getCookie(event, 'tenant_id')
      || ''

  console.warn('[proxy] →', url, {
    hasToken: !!accessToken,
    tenant: tenantId,
  })

  const headers: HeadersInit = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'X-Tenant-ID': tenantId,
  }
  try {
    const data = await $fetch(url, {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      query,
      body,
      headers,
    })
    return typeof data === 'object' && data !== null ? toCamel(data) : data
  }
  catch (error: any) {
    const backendPayload = error.response?._data

    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.statusText || 'Error',
      message:
        backendPayload?.message
        || error.message
        || 'Server Error',
      data: backendPayload || null,
      fatal: false,
    })
  }
})
