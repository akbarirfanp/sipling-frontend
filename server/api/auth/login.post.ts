import process from 'node:process'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, any>>(event)
  const remember = !!body?.rememberMe

  // 🔁 REAL branch
  const { apiGateway, apiLoginPath } = useRuntimeConfig(event)
  const upstream = await $fetch(`${apiGateway}${apiLoginPath}`, { method: 'POST', body })
  const res = toCamel(upstream)
  if (res.error)
    throw createError({ statusCode: 401, statusMessage: res.message || 'Login failed' })

  // Extract data from response
  const userData = res.data?.user || res.user
  const rawRoles = userData?.roles
  const roles = Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles ? [rawRoles] : []
  const permissions = Array.from(new Set(roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.name))))

  const user = {
    id: userData?.userId,
    username: userData?.username,
    name: userData?.name,
    email: userData?.email,
    roles: roles.map((r: any) => ({ id: r.id, name: r.name, tenantId: r.tenantId ?? null })),
    permissions,
  }

  const tenantId = roles[0]?.tenantId ?? null
  const tenantCode = res.data?.tenantCode ?? null
  const expiresAtMs = (res.data?.expiredAt ?? 0) * 1000
  const token = res.data?.token as string

  const session = {
    user,
    accessToken: token,
    tenantId,
    tenantCode,
    expiresAt: expiresAtMs,
    loggedInAt: Date.now(),
  }

  await setUserSession(
    event,
    session,
    {
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // <-- false di dev, true di prod
        sameSite: 'lax',
        httpOnly: true,
        path: '/',
      },
    },
  )

  setCookie(event, 'tenant_id', (tenantCode || ''), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  return { ok: true, user, tenantId, tenantCode }
})
