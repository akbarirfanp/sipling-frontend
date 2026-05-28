export default defineEventHandler(async (event) => {
  const s = await getUserSession(event)
  if (!s?.user)
    return { loggedIn: false }
  const { user, tenantId, tenantCode, expiresAt, loggedInAt } = s
  return { loggedIn: true, user, tenantId, tenantCode, expiresAt, loggedInAt }
})
