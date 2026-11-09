import type { H3Event } from 'h3'
import { getOptionalUser } from './session'

export async function getCurrentUserId(event?: H3Event): Promise<string> {
  if (event) {
    const user = await getOptionalUser(event)
    if (user?.id) {
      return user.id
    }
  }

  const config = useRuntimeConfig()
  return (
    process.env.DEV_USER_ID ??
    (config.devUserId as string | undefined) ??
    '00000000-0000-0000-0000-000000000001'
  )
}
