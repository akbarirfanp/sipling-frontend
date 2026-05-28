export default defineEventHandler(async (event) => {
  try {
    // Clear user session
    await clearUserSession(event)
    deleteCookie(event, 'tenant_id', { path: '/' })

    return {
      success: true,
      message: 'Logout berhasil',
    }
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Terjadi kesalahan saat logout',
    })
  }
})
