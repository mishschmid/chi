import { getOptionalUser } from '~~/server/utils/session'

const PUBLIC_PREFIXES = ['/api/auth/']
const PUBLIC_PATHS = new Set(['/api/health'])

export default defineEventHandler(async (event) => {
  const path = event.path ? event.path.split('?')[0] : ''
  if (!path || !path.startsWith('/api/')) return
  if (PUBLIC_PATHS.has(path)) return
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return

  const user = await getOptionalUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
