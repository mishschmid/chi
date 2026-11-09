import type { H3Event } from 'h3'
import { auth } from './auth'

/**
 * Resolve authenticated user from session, or throw 401.
 */
export async function requireUser(event: H3Event) {
  const user = await getOptionalUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

/**
 * Resolve authenticated user from session, or return null.
 * In development, if no session cookie exists but DEV_USER_ID is explicitly set, falls back to it.
 */
export async function getOptionalUser(event: H3Event) {
  try {
    const session = await auth.api.getSession({ headers: event.headers })
    if (session?.user) {
      return session.user
    }
  } catch (err) {
    console.warn('Failed to parse better-auth session:', err)
  }

  // Fallback for development/testing if header or DEV_USER_ID is provided
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_USER_ID) {
    return {
      id: process.env.DEV_USER_ID,
      name: 'Dev User',
      email: 'dev@chi.test',
      role: 'user',
    }
  }

  return null
}
