export interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
}

const userState = () => useState<AuthUser | null>('auth:user', () => null)

export function useAuth() {
  const user = userState()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const session = await $fetch<{ user?: AuthUser } | null>('/api/auth/get-session', {
        headers,
      })
      user.value = session?.user ?? null
    } catch {
      user.value = null
    }
    return user.value
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ user?: AuthUser }>('/api/auth/sign-in/email', {
        method: 'POST',
        body: { email, password },
      })
      user.value = res?.user ?? null
      return user.value
    } catch (err: any) {
      error.value = err?.statusMessage || err?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signUp(name: string, email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ user?: AuthUser }>('/api/auth/sign-up/email', {
        method: 'POST',
        body: { name, email, password },
      })
      user.value = res?.user ?? null
      return user.value
    } catch (err: any) {
      error.value = err?.statusMessage || err?.data?.message || 'Sign up failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      await $fetch('/api/auth/sign-out', {
        method: 'POST',
        body: {},
        headers: { 'content-type': 'application/json' },
      })
    } finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  return {
    user,
    loading,
    error,
    refresh,
    signIn,
    signUp,
    signOut,
  }
}
