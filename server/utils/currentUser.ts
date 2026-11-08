import type { H3Event } from 'h3'

// TODO(auth): Replace with the real shared auth service (better-auth SSO) once implemented.
// Every DB table with user data filters by this ID.
export function getCurrentUserId(_event?: H3Event): string {
  const config = useRuntimeConfig()
  return (
    process.env.DEV_USER_ID ??
    (config.devUserId as string | undefined) ??
    '00000000-0000-0000-0000-000000000001'
  )
}
