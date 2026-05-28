// export default defineNuxtRouteMiddleware((to) => {
//   const { loggedIn } = useUserSession()

//   const protectedRoutes = [
//     '/dashboard',
//     '/users',
//     '/service-request',
//     '/contacts',
//     '/crm',
//   ]

//   const isProtectedRoute = protectedRoutes.some(route => {
//     return to.path.startsWith(route)
//   })

//   if (isProtectedRoute && !loggedIn.value) {
//     const redirectTo = to.fullPath !== '/auth/login' ? to.fullPath : '/dashboard'
//     return navigateTo(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
//   }
// })

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path.startsWith('/auth'))
    return

  const { loggedIn, fetch } = useUserSession() as any

  // Skip fetch jika coming from logout (avoid double session call)
  const isComingFromLogout = from?.path && !from.path.startsWith('/auth') && to.path === '/auth/login'

  if (!loggedIn.value && !isComingFromLogout) {
    try {
      await fetch?.()
    }
    catch (error) {
      // Handle or log error if needed
      console.error('Failed to fetch user session:', error)
    }
  }

  if (!loggedIn.value)
    return navigateTo('/auth/login')
})
