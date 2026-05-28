export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Bisa terima 2 bentuk:
  // A) langsung payload upstream { error,status,message,data:{ user:{...}, token,... } }
  // B) payload normalized { user, secure:{token,expiredAt}, tenantCode, rememberMe }
  const src = body?.data ? toCamel(body) : body

  // Bentuk A (payload upstream) -> normalize
  if (src?.data?.user && src?.data?.token) {
    const d = src.data
    const roles = Array.isArray(d.user.roles) ? d.user.roles : []
    const permissions = Array.from(new Set(roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.name))))

    const user = {
      id: d.user.userId,
      username: d.user.username,
      name: d.user.name,
      email: d.user.email,
      roles: roles.map((r: any) => ({ id: r.id, name: r.name, tenantId: r.tenantId })),
      permissions,
    }
    const tenantId = roles[0]?.tenantId ?? null
    const tenantCode = d.tenantCode
    const expiresAt = new Date((d.expiredAt ?? 0) * 1000).toISOString()
    const rememberMe = !!src.rememberMe

    await setUserSession(event, {
      user,
      tenantId,
      tenantCode,
      accessToken: d.token, // mudah diakses BFF
      secure: { token: d.token, expiredAt: expiresAt }, // aman kalau _auth GET hide secure
      expiresAt,
      loggedInAt: Date.now(),
      isExternal: d.isExternal, // untuk detect Genesys user
    }, {
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    })

    // cookie tenant buat FE inject header X-Tenant-ID
    setCookie(event, 'tenant_id', tenantId || tenantCode || '', { httpOnly: false, sameSite: 'lax', path: '/' })

    return { success: true, user, tenantId, tenantCode, expiresAt }
  }

  // Bentuk B (sudah normalized)
  if (src?.user && (src?.secure?.token || src?.accessToken)) {
    const rememberMe = !!src.rememberMe
    await setUserSession(event, src, { maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7 })
    if (src.tenantId || src.tenantCode)
      setCookie(event, 'tenant_id', src.tenantId || src.tenantCode, { httpOnly: false, sameSite: 'lax', path: '/' })
    return { success: true, user: src.user }
  }

  throw createError({ statusCode: 400, statusMessage: 'Bad session payload' })
})
