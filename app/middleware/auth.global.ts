const PUBLIC_ROUTES = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, refresh } = useAuth()
  if (user.value === null) {
    await refresh()
  }

  const isPublic = PUBLIC_ROUTES.has(to.path)

  if (!user.value && !isPublic) {
    return navigateTo('/login')
  }

  if (user.value && isPublic) {
    return navigateTo('/')
  }
})
